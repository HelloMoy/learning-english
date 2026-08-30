import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { LocalFilesystemBlobStore } from "../src/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store.ts";
import {
  resolveLessonRow,
  resolveResourceRow,
  type LessonRow,
  type ResourceRow,
} from "../src/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row.ts";
import { Course } from "../src/domain/entities/course/course.ts";
import { Module } from "../src/domain/entities/module/module.ts";
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
import { usesTitleFromNotes } from "./title-from-notes-modules.ts";
import { lessonTitleOverride } from "./title-overrides.ts";
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
  // guard that prevents slug↔disk drift (kebab-case keys pointing at raw
  // folders) from ever shipping silently again.
  //
  // `baseUrl` is irrelevant here: this store is used ONLY for `exists()`,
  // which resolves against `localRoot`. The generator does not resolve keys
  // to URLs — the public prefix is a deployment concern, decided at boot by
  // `use-case-dependencies.ts`.
  const blobStore = new LocalFilesystemBlobStore({
    baseUrl: UNUSED_BASE_URL,
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
    seed.lessonRows,
    seed.resourceRows,
    seed.sourceNames,
    seed.notesKeys,
  );
  writeFileSync(args.outFile, await formatWithPrettier(output, args.outFile), "utf8");
  console.log(
    `[seed-gen] Wrote ${seed.modules.length} modules, ${seed.lessonRows.length} lessons, ${seed.resourceRows.length} resources → ${args.outFile}`,
  );
}

/**
 * Placeholder prefix for the `LocalFilesystemBlobStore` instances this script
 * builds. Both are used only for validation (`exists()` on disk, and a
 * resolve-then-parse pass that proves each row yields a valid entity); the
 * value never reaches the emitted seed.
 */
const UNUSED_BASE_URL = "/unused-by-the-generator";

export type BuiltSeed = {
  course: Course;
  modules: Module[];
  /** Lesson rows whose `source` / `poster` hold content KEYS, not URLs. */
  lessonRows: LessonRow[];
  /** Resource rows whose `url` holds a content KEY, not a URL. */
  resourceRows: ResourceRow[];
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
 * Pure builder: walks the source directory and returns the seed's course and
 * modules as parsed entities, and its lessons and resources as ROWS holding
 * content keys. Side-effect-free (aside from reading files). The CLI entry
 * point (`runGenerator`) writes the rendered file.
 */
export async function buildSeed(sourceDir: string): Promise<BuiltSeed> {
  // Validation only. Every row is run through the same resolver the runtime
  // adapters use, so a row that could never become a valid entity fails here
  // rather than at request time. The prefix it resolves with is discarded.
  const validationStore = new LocalFilesystemBlobStore({
    baseUrl: UNUSED_BASE_URL,
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
  const lessonRows: LessonRow[] = [];
  const resourceRows: ResourceRow[] = [];

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
        { titleFromNotesHeading: usesTitleFromNotes(moduleSlug) },
      );

      // Resolved once and threaded into both the lesson and its notes
      // Resource: they are titled from the same string, so they cannot drift
      // apart. An override outranks the heading and the slug alike.
      const title =
        lessonTitleOverride(`${courseSlug}/${moduleSlug}/${lessonSlug}`) ?? classified.title;

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

        // The row carries KEYS. `resolveLessonRow` is called purely to prove
        // the row becomes a valid entity once a BlobStore resolves it; its
        // return value is discarded.
        const row: LessonRow = {
          kind: "video",
          id: lessonId,
          courseId,
          moduleId,
          sequence: lessonSequence,
          title,
          description: classified.description,
          source: videoFullKey,
          durationSeconds,
          ...(posterFullKey ? { poster: posterFullKey } : {}),
        };
        resolveLessonRow(row, validationStore);
        lessonRows.push(row);

        for (let i = 0; i < classified.resourceKeys.length; i++) {
          const resourceKey = classified.resourceKeys[i] as string;
          const rawName = classified.resourceRawNames[i] as string;
          const fullKey = `${courseSlug}/${moduleSlug}/${resourceKey}`;
          const resourceRow = buildResourceRow(lessonId, fullKey, title);
          resolveResourceRow(resourceRow, validationStore);
          resourceRows.push(resourceRow);
          // Priority for sourceNames: raw on-disk filename (always available
          // because classifyLessonFolder reads the folder at walk time) >
          // manifest entry (legacy path) > current slugified basename.
          recordSourceName(resourceRow.id, fullKey, rawName);
          keys.push(fullKey);
        }
      } else {
        const row: LessonRow = {
          kind: "reading",
          id: lessonId,
          courseId,
          moduleId,
          sequence: lessonSequence,
          title,
          body: classified.body,
        };
        resolveLessonRow(row, validationStore);
        lessonRows.push(row);

        for (let i = 0; i < classified.resourceKeys.length; i++) {
          const resourceKey = classified.resourceKeys[i] as string;
          const rawName = classified.resourceRawNames[i] as string;
          const fullKey = `${courseSlug}/${moduleSlug}/${resourceKey}`;
          const resourceRow = buildResourceRow(lessonId, fullKey, title);
          resolveResourceRow(resourceRow, validationStore);
          resourceRows.push(resourceRow);
          // Priority for sourceNames: raw on-disk filename (always available
          // because classifyLessonFolder reads the folder at walk time) >
          // manifest entry (legacy path) > current slugified basename.
          recordSourceName(resourceRow.id, fullKey, rawName);
          keys.push(fullKey);
        }
      }
    }
  }

  // Sort: modules and lessons by sequence; resources by lessonId then title.
  modules.sort((a, b) => a.sequence - b.sequence);
  lessonRows.sort((a, b) => {
    if (a.moduleId !== b.moduleId) return a.moduleId.localeCompare(b.moduleId);
    return a.sequence - b.sequence;
  });
  resourceRows.sort((a, b) => {
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
    lessonCount: lessonRows.length,
    moduleCount: modules.length,
  });

  return { course, modules, lessonRows, resourceRows, sourceNames, keys, notesKeys };
}

function buildResourceRow(lessonId: string, resourceKey: string, lessonTitle: string): ResourceRow {
  const fileName = path.basename(resourceKey);
  const isReadme = fileName.toLowerCase() === "readme.md";
  return {
    id: uuidv5(`resource:${resourceKey}`),
    lessonId,
    title: isReadme ? `${lessonTitle} Notes` : resourceTitleFromFile(fileName),
    url: resourceKey,
    kind: classifyResourceKind(fileName),
  };
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
  lessonRows: LessonRow[],
  resourceRows: ResourceRow[],
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
//
// Lesson and resource entries are ROWS, not entities: their \`source\`,
// \`poster\` and \`url\` fields hold opaque content KEYS. A key is turned into
// a URL at read time by the local-filesystem adapters, using whichever
// BlobStore \`use-case-dependencies.ts\` was configured with. That is what
// makes repointing storage a config change instead of a regeneration — and
// what makes per-request signed URLs possible at all.

import type {
  LessonRow,
  ResourceRow,
} from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";

export const SEED_CONTENT_COURSE_ID = "${course.id}";

export const seedContentCourse = Course.parse(${JSON.stringify(course, null, 2)});

const _seedContentModuleRaw = [
  ${renderJsonArray(modules)},
];

export const seedContentModules: ReadonlyArray<Module> = _seedContentModuleRaw.map((m) =>
  Module.parse(m),
);

export const seedContentLessonRows: ReadonlyArray<LessonRow> = [
  ${renderJsonArray(lessonRows)},
];

export const seedContentResourceRows: ReadonlyArray<ResourceRow> = [
  ${renderJsonArray(resourceRows)},
];

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
