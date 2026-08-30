import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { LocalFilesystemBlobStore } from "../src/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store.ts";
import { Course } from "../src/domain/entities/course/course.ts";
import { Lesson } from "../src/domain/entities/lesson/lesson.ts";
import { Module } from "../src/domain/entities/module/module.ts";
import { Resource } from "../src/domain/entities/resource/resource.ts";
import {
  classifyLessonFolder,
  classifyResourceKind,
  folderExists,
  humanize,
  listLessonFolders,
  listSubdirectories,
  parseSequence,
  resourceTitleFromFile,
} from "./discriminate-lesson.ts";
import { probeDurationSeconds } from "./ffprobe.ts";
import { resolveSlug, toPosix } from "./resolve-slug.ts";
import { uuidv5 } from "./uuid.ts";

/**
 * CLI args (typed, no framework).
 */
type Args = {
  source: string;
  out: string;
  help: boolean;
};

function parseArgs(argv: ReadonlyArray<string>): Args {
  let source = "public/local-filesystem-lesson";
  let out = "src/adapters/persistence/in-memory/seed/seed-content.ts";
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--source" && argv[i + 1]) {
      source = argv[i + 1] as string;
      i++;
    } else if (arg === "--out" && argv[i + 1]) {
      out = argv[i + 1] as string;
      i++;
    }
  }
  return { source, out, help };
}

const HELP_TEXT = `Usage: tsx scripts/generate-course-content-seed.ts [options]

Walks <source> (default: public/local-filesystem-lesson), classifies each
lesson folder, and emits a TypeScript seed file at <out>
(default: src/adapters/persistence/in-memory/seed/seed-content.ts).

Options:
  --source <dir>   Source directory (default: public/local-filesystem-lesson)
  --out <file>     Output .ts file (default: src/adapters/persistence/in-memory/seed/seed-content.ts)
  --help, -h       Show this help

Environment:
  FFPROBE_PATH     Override the ffprobe binary location.
`;

/**
 * Top-level orchestration. Exported separately so the test suite can
 * drive it against a synthetic fixture without spawning a subprocess.
 */
export async function runGenerator(args: { sourceDir: string; outFile: string }): Promise<void> {
  if (!folderExists(args.sourceDir)) {
    throw new Error(`Source directory not found: ${args.sourceDir}`);
  }

  const seed = await buildSeed(args.sourceDir);

  // Fail loudly if any emitted key does not resolve on disk — this is the
  // guard that prevents slug↔disk drift (kebab-case URLs pointing at raw
  // folders) from ever shipping silently again.
  const blobStore = new LocalFilesystemBlobStore({
    baseUrl: "/local-filesystem-lesson",
    localRoot: path.resolve(args.sourceDir),
  });
  const missing: string[] = [];
  for (const key of seed.keys) {
    if (!(await blobStore.exists(key))) missing.push(key);
  }
  for (const key of Object.values(seed.notesKeys)) {
    if (!(await blobStore.exists(key))) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} content key(s) do not resolve on disk (run \`tsx scripts/normalize-content-disk.ts --apply\` first?):\n  ${missing.join("\n  ")}`,
    );
  }

  const output = renderSeedFile(
    seed.course,
    seed.modules,
    seed.lessons,
    seed.resources,
    seed.sourceNames,
    seed.notesKeys,
  );
  writeFileSync(args.outFile, await formatWithPrettier(output, args.outFile), "utf8");
  console.log(
    `[seed-gen] Wrote ${seed.modules.length} modules, ${seed.lessons.length} lessons, ${seed.resources.length} resources → ${args.outFile}`,
  );
}

export type BuiltSeed = {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  resources: Resource[];
  /**
   * Entity id → original raw name (as it appeared on disk before the
   * normalization rename). Sourced from `rename-manifest.json`; falls back
   * to the current on-disk name when no manifest entry exists.
   */
  sourceNames: Record<string, string>;
  /**
   * Every content key emitted (video sources, posters, resources), relative
   * to the content root. `runGenerator` validates each via `BlobStore.exists`.
   */
  keys: string[];
  /**
   * `lessonId` → the normalized Markdown notes key (relative to the content
   * root) for that lesson's inline notes, when a `readme.md` is present.
   * Lessons without Markdown notes have no entry. Keys are validated with
   * `BlobStore.exists` by `runGenerator`.
   */
  notesKeys: Record<string, string>;
};

/** Shape of the manifest written by `scripts/normalize-content-disk.ts`. */
type RenameManifest = {
  version: number;
  entries: Array<{ from: string; to: string }>;
};

/**
 * Loads `rename-manifest.json` from the content root and returns a reverse
 * map: slug relative path → original leaf name (the pre-rename folder/file
 * name). Missing or malformed manifest → empty map (callers fall back to the
 * current on-disk name).
 */
function loadOriginalNameMap(sourceDir: string): Map<string, string> {
  const map = new Map<string, string>();
  const manifestPath = path.join(sourceDir, "rename-manifest.json");
  if (!existsSync(manifestPath)) return map;
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as RenameManifest;
    for (const entry of parsed.entries ?? []) {
      if (entry && typeof entry.from === "string" && typeof entry.to === "string") {
        map.set(toPosix(entry.to), path.basename(entry.from));
      }
    }
  } catch {
    // Malformed manifest → behave as if absent.
  }
  return map;
}

/**
 * Pure builder: walks the source directory and returns the parsed seed
 * arrays. Side-effect-free (aside from reading files). The CLI entry
 * point (`runGenerator`) writes the rendered file.
 */
export async function buildSeed(sourceDir: string): Promise<BuiltSeed> {
  const blobStore = new LocalFilesystemBlobStore({
    baseUrl: "/local-filesystem-lesson",
    localRoot: path.resolve(sourceDir),
  });

  const originalNames = loadOriginalNameMap(sourceDir);
  const sourceNames: Record<string, string> = {};
  const keys: string[] = [];
  const notesKeys: Record<string, string> = {};
  const recordSourceName = (id: string, slugRelPath: string, fallbackLeaf: string): void => {
    sourceNames[id] = originalNames.get(slugRelPath) ?? fallbackLeaf;
  };

  const courseFolders = listSubdirectories(sourceDir);
  if (courseFolders.length === 0) {
    throw new Error(`No course folders found in ${sourceDir}`);
  }
  if (courseFolders.length > 1) {
    console.warn(
      `[seed-gen] Multiple top-level folders in ${sourceDir}; using the first: "${courseFolders[0]}". Pass a more specific --source if this is wrong.`,
    );
  }
  const courseFolder = courseFolders[0] as string;
  const courseSlug = resolveSlug(courseFolder);
  const courseId = uuidv5(`course:${courseSlug}`);
  recordSourceName(courseId, courseSlug, courseFolder);

  const modules: Module[] = [];
  const lessons: Lesson[] = [];
  const resources: Resource[] = [];

  const moduleFolders = listSubdirectories(path.join(sourceDir, courseFolder));

  for (const moduleFolder of moduleFolders) {
    const moduleSlug = resolveSlug(moduleFolder);
    const moduleId = uuidv5(`module:${courseSlug}/${moduleSlug}`);
    const moduleSequence = parseSequence(moduleSlug);
    recordSourceName(moduleId, `${courseSlug}/${moduleSlug}`, moduleFolder);

    modules.push(
      Module.parse({
        id: moduleId,
        courseId,
        slug: moduleSlug,
        title: humanize(moduleSlug),
        sequence: moduleSequence,
      }),
    );

    const lessonFolders = listLessonFolders(path.join(sourceDir, courseFolder, moduleFolder));

    for (const lessonFolder of lessonFolders) {
      const lessonSlug = resolveSlug(lessonFolder);
      const lessonId = uuidv5(`lesson:${courseSlug}/${moduleSlug}/${lessonSlug}`);
      const lessonSequence = parseSequence(lessonSlug);
      recordSourceName(lessonId, `${courseSlug}/${moduleSlug}/${lessonSlug}`, lessonFolder);

      const classified = classifyLessonFolder(
        path.join(sourceDir, courseFolder, moduleFolder, lessonFolder),
        lessonSlug,
      );

      if (classified.kind === "video") {
        const videoPath = path.join(
          sourceDir,
          courseFolder,
          moduleFolder,
          lessonFolder,
          classified.videoFileName,
        );
        const durationSeconds = await probeDurationSeconds(videoPath);

        // Keys from classifyLessonFolder are lesson-relative; the BlobStore
        // expects keys relative to its `localRoot` (== sourceDir). Compose
        // the full key here so the URL points at the right path.
        const videoFullKey = `${courseSlug}/${moduleSlug}/${classified.videoKey}`;
        const posterFullKey = classified.posterKey
          ? `${courseSlug}/${moduleSlug}/${classified.posterKey}`
          : null;
        keys.push(videoFullKey);
        if (posterFullKey) keys.push(posterFullKey);
        if (classified.readmeKey) {
          notesKeys[lessonId] = `${courseSlug}/${moduleSlug}/${classified.readmeKey}`;
        }

        const lesson = Lesson.parse({
          kind: "video",
          id: lessonId,
          courseId,
          moduleId,
          sequence: lessonSequence,
          title: classified.title,
          description: classified.description,
          source: blobStore.url(videoFullKey),
          durationSeconds,
          poster: posterFullKey ? blobStore.url(posterFullKey) : undefined,
        });
        lessons.push(lesson);

        for (let i = 0; i < classified.resourceKeys.length; i++) {
          const resourceKey = classified.resourceKeys[i] as string;
          const rawName = classified.resourceRawNames[i] as string;
          const fullKey = `${courseSlug}/${moduleSlug}/${resourceKey}`;
          const resource = buildResource(lessonId, fullKey, blobStore, classified.title);
          resources.push(resource);
          // Priority for sourceNames: raw on-disk filename (always available
          // because classifyLessonFolder reads the folder at walk time) >
          // manifest entry (legacy path) > current slugified basename.
          recordSourceName(resource.id, fullKey, rawName);
          keys.push(fullKey);
        }
      } else {
        const lesson = Lesson.parse({
          kind: "reading",
          id: lessonId,
          courseId,
          moduleId,
          sequence: lessonSequence,
          title: classified.title,
          body: classified.body,
        });
        lessons.push(lesson);

        for (let i = 0; i < classified.resourceKeys.length; i++) {
          const resourceKey = classified.resourceKeys[i] as string;
          const rawName = classified.resourceRawNames[i] as string;
          const fullKey = `${courseSlug}/${moduleSlug}/${resourceKey}`;
          const resource = buildResource(lessonId, fullKey, blobStore, classified.title);
          resources.push(resource);
          // Priority for sourceNames: raw on-disk filename (always available
          // because classifyLessonFolder reads the folder at walk time) >
          // manifest entry (legacy path) > current slugified basename.
          recordSourceName(resource.id, fullKey, rawName);
          keys.push(fullKey);
        }
      }
    }
  }

  // Sort: modules and lessons by sequence; resources by lessonId then title.
  modules.sort((a, b) => a.sequence - b.sequence);
  lessons.sort((a, b) => {
    if (a.moduleId !== b.moduleId) return a.moduleId.localeCompare(b.moduleId);
    return a.sequence - b.sequence;
  });
  resources.sort((a, b) => {
    if (a.lessonId !== b.lessonId) return a.lessonId.localeCompare(b.lessonId);
    return a.title.localeCompare(b.title);
  });

  const course = Course.parse({
    id: courseId,
    slug: courseSlug,
    title: humanize(courseSlug),
    // Relative to the repo root, never the absolute `sourceDir`: the CLI
    // resolves that to wherever the repo happens to be checked out, which
    // would bake one machine's home directory into the committed seed and
    // make regeneration produce a diff on every other machine.
    description: `Course content generated from ${toPosix(path.relative(process.cwd(), sourceDir))}.`,
    language: "en",
    lessonCount: lessons.length,
    moduleCount: modules.length,
  });

  return { course, modules, lessons, resources, sourceNames, keys, notesKeys };
}

function buildResource(
  lessonId: string,
  resourceKey: string,
  blobStore: LocalFilesystemBlobStore,
  lessonTitle: string,
): Resource {
  const fileName = path.basename(resourceKey);
  const isReadme = fileName.toLowerCase() === "readme.md";
  return Resource.parse({
    id: uuidv5(`resource:${resourceKey}`),
    lessonId,
    title: isReadme ? `${lessonTitle} Notes` : resourceTitleFromFile(fileName),
    url: blobStore.url(resourceKey),
    kind: classifyResourceKind(fileName),
  });
}

/**
 * Runs the repo's Prettier config over the rendered source before it is
 * written. `JSON.stringify` quotes every key and omits trailing commas, so
 * raw output fails `pnpm format:check` the moment the seed is regenerated.
 * Formatting here keeps the committed file byte-identical to what
 * `pnpm format` would produce.
 */
async function formatWithPrettier(source: string, filePath: string): Promise<string> {
  const prettier = await import("prettier");
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(source, { ...config, filepath: filePath });
}

function renderSeedFile(
  course: Course,
  modules: Module[],
  lessons: Lesson[],
  resources: Resource[],
  sourceNames: Record<string, string>,
  notesKeys: Record<string, string>,
): string {
  // One JSON object per entity keeps the diff readable when content
  // changes. `formatWithPrettier` normalizes the result before it is
  // written, so this only has to be valid TypeScript, not pretty.
  const renderJsonArray = <T>(items: ReadonlyArray<T>): string =>
    items.map((item) => JSON.stringify(item, null, 2).replace(/\n/g, "\n  ")).join(",\n  ");

  return `// AUTOGENERATED by scripts/generate-course-content-seed.ts. DO NOT EDIT.
// Re-run the generator after adding content under public/local-filesystem-lesson/.
//
// The generator formats this file with the repo's Prettier config, so the
// committed output is what \`pnpm format\` would produce — no hand-edits.

import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";

export const SEED_CONTENT_COURSE_ID = "${course.id}";

export const seedContentCourse = Course.parse(${JSON.stringify(course, null, 2)});

const _seedContentModuleRaw = [
  ${renderJsonArray(modules)},
];

export const seedContentModules: ReadonlyArray<Module> = _seedContentModuleRaw.map((m) =>
  Module.parse(m),
);

const _seedContentLessonRaw = [
  ${renderJsonArray(lessons)},
];

export const seedContentLessons: ReadonlyArray<Lesson> = _seedContentLessonRaw.map((l) =>
  Lesson.parse(l),
);

const _seedContentResourceRaw = [
  ${renderJsonArray(resources)},
];

export const seedContentResources: ReadonlyArray<Resource> = _seedContentResourceRaw.map((r) =>
  Resource.parse(r),
);

// Entity id → original raw on-disk name (pre-normalization). See
// scripts/normalize-content-disk.ts and rename-manifest.json.
export const seedContentSourceNames: Record<string, string> = ${JSON.stringify(sourceNames, null, 2)};

// lessonId → the normalized Markdown notes key (relative to the
// BlobStore localRoot). Consumed by LocalFilesystemLessonNotesRepository
// to render inline notes without re-deriving the path from the lesson slug.
export const seedContentNotesKeys: Record<string, string> = ${JSON.stringify(notesKeys, null, 2)};
`;
}

// CLI entry point.
if (process.argv[1] && process.argv[1].endsWith("generate-course-content-seed.ts")) {
  void run();
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }
  try {
    await runGenerator({
      sourceDir: path.resolve(args.source),
      outFile: path.resolve(args.out),
    });
  } catch (err) {
    console.error("[seed-gen] FAILED:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
