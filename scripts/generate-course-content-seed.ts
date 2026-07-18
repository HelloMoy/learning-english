import { writeFileSync } from "node:fs";
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
import { SLUG_OVERRIDES } from "./slug-overrides.ts";
import { slugify } from "./slug.ts";
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
  const output = renderSeedFile(seed.course, seed.modules, seed.lessons, seed.resources);
  writeFileSync(args.outFile, output, "utf8");
  console.log(
    `[seed-gen] Wrote ${seed.modules.length} modules, ${seed.lessons.length} lessons, ${seed.resources.length} resources → ${args.outFile}`,
  );
}

export type BuiltSeed = {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  resources: Resource[];
};

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

  const modules: Module[] = [];
  const lessons: Lesson[] = [];
  const resources: Resource[] = [];

  const moduleFolders = listSubdirectories(path.join(sourceDir, courseFolder));

  for (const moduleFolder of moduleFolders) {
    const moduleSlug = resolveSlug(moduleFolder);
    const moduleId = uuidv5(`module:${courseSlug}/${moduleSlug}`);
    const moduleSequence = parseSequence(moduleSlug);

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
          path.basename(classified.videoKey),
        );
        const durationSeconds = await probeDurationSeconds(videoPath);

        // Keys from classifyLessonFolder are lesson-relative; the BlobStore
        // expects keys relative to its `localRoot` (== sourceDir). Compose
        // the full key here so the URL points at the right path.
        const videoFullKey = `${courseSlug}/${moduleSlug}/${classified.videoKey}`;
        const posterFullKey = classified.posterKey
          ? `${courseSlug}/${moduleSlug}/${classified.posterKey}`
          : null;

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

        for (const resourceKey of classified.resourceKeys) {
          const fullKey = `${courseSlug}/${moduleSlug}/${resourceKey}`;
          resources.push(buildResource(lessonId, fullKey, blobStore, classified.title));
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

        for (const resourceKey of classified.resourceKeys) {
          const fullKey = `${courseSlug}/${moduleSlug}/${resourceKey}`;
          resources.push(buildResource(lessonId, fullKey, blobStore, classified.title));
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
    description: `Course content generated from ${sourceDir}.`,
    language: "en",
    lessonCount: lessons.length,
    moduleCount: modules.length,
  });

  return { course, modules, lessons, resources };
}

function resolveSlug(rawName: string): string {
  if (Object.prototype.hasOwnProperty.call(SLUG_OVERRIDES, rawName)) {
    return SLUG_OVERRIDES[rawName] as string;
  }
  return slugify(rawName);
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

function renderSeedFile(
  course: Course,
  modules: Module[],
  lessons: Lesson[],
  resources: Resource[],
): string {
  // Per-line JSON for each entity keeps prettier happy and the diff
  // readable when content changes.
  const renderJsonArray = <T>(items: ReadonlyArray<T>): string =>
    items.map((item) => JSON.stringify(item, null, 2).replace(/\n/g, "\n  ")).join(",\n  ");

  return `// AUTOGENERATED by scripts/generate-course-content-seed.ts. DO NOT EDIT.
// Re-run the generator after adding content under public/local-filesystem-lesson/.
//
// prettier-ignore — the JSON-per-line layout below is committed-as-rendered.

/* eslint-disable */
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
