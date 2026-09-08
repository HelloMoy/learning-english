import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { BlobStore } from "../src/adapters/persistence/blob-store/blob-store.ts";
import { LocalFilesystemBlobStore } from "../src/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store.ts";
import {
  resolveLessonRow,
  resolveResourceRow,
  type LessonRow,
  type ResourceRow,
} from "../src/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row.ts";
import { Course } from "../src/domain/entities/course/course.ts";
import { Module } from "../src/domain/entities/module/module.ts";
import { isAbsoluteHttpUrl } from "../src/domain/entities/url-or-path/url-or-path.ts";
import {
  COURSES_MANIFEST_FILE,
  loadCoursesManifest,
  resolveCourseDeclaration,
  type ResolvedCourse,
} from "./courses-manifest/courses-manifest.ts";
import {
  classifyLessonFolder,
  classifyResourceKind,
  folderExists,
  humanize,
  listLessonFolders,
  listSubdirectories,
  parseSequence,
  resourceTitleFromFile,
  type ClassifiedLesson,
} from "./discriminate-lesson.ts";
import { probeDurationSeconds } from "./ffprobe.ts";
import { resolveSlug, toPosix } from "./resolve-slug.ts";
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

  const output = renderSeedFile(seed);
  writeFileSync(args.outFile, await formatWithPrettier(output, args.outFile), "utf8");
  console.log(
    `[seed-gen] Wrote ${seed.courses.length} courses, ${seed.modules.length} modules, ${seed.lessonRows.length} lessons, ${seed.resourceRows.length} resources → ${args.outFile}`,
  );
}

/**
 * Placeholder prefix for the `LocalFilesystemBlobStore` instances this script
 * builds. Both are used only for validation (`exists()` on disk, and a
 * resolve-then-parse pass that proves each row yields a valid entity); the
 * value never reaches the emitted seed.
 */
const UNUSED_BASE_URL = "/unused-by-the-generator";

/**
 * Ladder position for a content root with no `courses.manifest.json`.
 *
 * A course's place in the ladder cannot be derived from the content it holds,
 * so a declared course states it. With nothing declared there is exactly one
 * course and one sensible answer: `1` belongs to the hand-written A1 seed in
 * `seed.ts`, so the filesystem-backed course follows it — which is what the
 * generator emitted before the manifest existed.
 */
const UNDECLARED_COURSE_SEQUENCE = 2;

export type BuiltSeed = {
  /** Every declared course, in ladder order. */
  courses: Course[];
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
 * The courses to walk: whatever `courses.manifest.json` declares, or — when
 * the content root has none — the first top-level folder with every field
 * derived, which is exactly what the generator emitted before the manifest
 * existed.
 *
 * A folder that no entry names is a staging area, not an error: it is
 * reported and skipped, so half-imported content never silently ships.
 */
function resolveCoursesToWalk(sourceDir: string): ResolvedCourse[] {
  const courseFolders = listSubdirectories(sourceDir);
  if (courseFolders.length === 0) {
    throw new Error(`No course folders found in ${sourceDir}`);
  }

  const declared = loadCoursesManifest(sourceDir);
  if (declared === null) {
    return [
      resolveCourseDeclaration(
        { folder: courseFolders[0] as string, sequence: UNDECLARED_COURSE_SEQUENCE },
        sourceDir,
      ),
    ];
  }

  const declaredFolders = new Set(declared.map((course) => course.folder));
  const skipped = courseFolders.filter((folder) => !declaredFolders.has(folder));
  if (skipped.length > 0) {
    console.warn(
      `[seed-gen] Skipping folders no course declares in ${COURSES_MANIFEST_FILE}: ${skipped.join(", ")}`,
    );
  }
  return declared;
}

/** Accumulators the walk fills in, shared across every course. */
type SeedAccumulator = {
  courses: Course[];
  modules: Module[];
  lessonRows: LessonRow[];
  resourceRows: ResourceRow[];
  sourceNames: Record<string, string>;
  keys: string[];
  notesKeys: Record<string, string>;
};

/** Everything a course walk needs beyond the course itself. */
type WalkContext = {
  sourceDir: string;
  validationStore: BlobStore;
  originalNames: Map<string, string>;
  seed: SeedAccumulator;
};

/**
 * Pure builder: walks the declared course folders and returns their courses
 * and modules as parsed entities, and their lessons and resources as ROWS
 * holding content keys. Side-effect-free (aside from reading files). The CLI
 * entry point (`runGenerator`) writes the rendered file.
 */
export async function buildSeed(sourceDir: string): Promise<BuiltSeed> {
  // Validation only. Every row is run through the same resolver the runtime
  // adapters use, so a row that could never become a valid entity fails here
  // rather than at request time. The prefix it resolves with is discarded.
  const validationStore = new LocalFilesystemBlobStore({
    baseUrl: UNUSED_BASE_URL,
    localRoot: path.resolve(sourceDir),
  });

  const seed: SeedAccumulator = {
    courses: [],
    modules: [],
    lessonRows: [],
    resourceRows: [],
    sourceNames: {},
    keys: [],
    notesKeys: {},
  };
  const context: WalkContext = {
    sourceDir,
    validationStore,
    originalNames: loadOriginalNameMap(sourceDir),
    seed,
  };

  for (const course of resolveCoursesToWalk(sourceDir)) {
    await appendCourse(course, context);
  }

  sortSeed(seed);
  return {
    courses: seed.courses,
    modules: seed.modules,
    lessonRows: seed.lessonRows,
    resourceRows: seed.resourceRows,
    sourceNames: seed.sourceNames,
    keys: seed.keys,
    notesKeys: seed.notesKeys,
  };
}

/** Walks one declared course folder and appends everything it holds. */
async function appendCourse(course: ResolvedCourse, context: WalkContext): Promise<void> {
  // The key prefix is the folder's normalized name, NOT `course.slug`: keys
  // must equal the physical path under the content root, while the slug is
  // free to differ because it only ever appears in URLs.
  const keyPrefix = slugify(course.folder);
  const courseId = uuidv5(`course:${course.slug}`);
  recordSourceName(context, courseId, keyPrefix, course.folder);

  const courseDir = path.join(context.sourceDir, course.folder);
  const lessonCountBefore = context.seed.lessonRows.length;
  const moduleCountBefore = context.seed.modules.length;

  const moduleSlugs: string[] = [];
  for (const moduleFolder of listSubdirectories(courseDir)) {
    moduleSlugs.push(await appendModule({ course, courseId, keyPrefix, moduleFolder }, context));
  }
  assertEveryModuleTitleOverrideMatched(course, moduleSlugs);

  context.seed.courses.push(
    Course.parse({
      id: courseId,
      slug: course.slug,
      title: course.title,
      description: course.description,
      language: course.language,
      lessonCount: context.seed.lessonRows.length - lessonCountBefore,
      moduleCount: context.seed.modules.length - moduleCountBefore,
      sequence: course.sequence,
    }),
  );
}

/**
 * Fails when a `moduleTitleOverrides` key names no module of its course.
 *
 * A mistyped module slug is otherwise invisible: the entry simply never
 * matches, and the derived title the author was trying to replace survives
 * into the seed unremarked.
 */
function assertEveryModuleTitleOverrideMatched(
  course: ResolvedCourse,
  moduleSlugs: ReadonlyArray<string>,
): void {
  const present = new Set(moduleSlugs);
  const unmatched = Object.keys(course.moduleTitleOverrides).filter((slug) => !present.has(slug));
  if (unmatched.length > 0) {
    throw new Error(
      `${COURSES_MANIFEST_FILE}: course "${course.folder}" declares moduleTitleOverrides for modules it does not hold: ${unmatched.join(", ")}`,
    );
  }
}

/** Identity of the course a module or lesson is being walked under. */
type CourseScope = {
  course: ResolvedCourse;
  courseId: string;
  /** The course's content-key prefix — its normalized folder name. */
  keyPrefix: string;
};

/**
 * Walks one module folder and appends the module plus all its lessons.
 *
 * @returns The module's slug, so the caller can check every declared
 *          `moduleTitleOverrides` key against a module that actually exists.
 */
async function appendModule(
  scope: CourseScope & { moduleFolder: string },
  context: WalkContext,
): Promise<string> {
  const { course, courseId, keyPrefix, moduleFolder } = scope;
  const moduleSlug = resolveSlug(moduleFolder, course.slugOverrides);
  const moduleId = uuidv5(`module:${course.slug}/${moduleSlug}`);
  recordSourceName(context, moduleId, `${keyPrefix}/${moduleSlug}`, moduleFolder);

  context.seed.modules.push(
    Module.parse({
      id: moduleId,
      courseId,
      slug: moduleSlug,
      title: course.moduleTitleOverrides[moduleSlug] ?? humanize(moduleSlug),
      sequence: parseSequence(moduleSlug),
    }),
  );

  const moduleDir = path.join(context.sourceDir, course.folder, moduleFolder);
  for (const lessonFolder of listLessonFolders(moduleDir)) {
    await appendLesson({ ...scope, moduleSlug, moduleId, lessonFolder }, context);
  }
  return moduleSlug;
}

/** Identity of the module a lesson is being walked under. */
type ModuleScope = CourseScope & {
  moduleFolder: string;
  moduleSlug: string;
  moduleId: string;
};

/** Classifies one lesson folder and appends its lesson row and resources. */
async function appendLesson(
  scope: ModuleScope & { lessonFolder: string },
  context: WalkContext,
): Promise<void> {
  const { course, courseId, keyPrefix, moduleFolder, moduleSlug, moduleId, lessonFolder } = scope;
  const lessonSlug = resolveSlug(lessonFolder, course.slugOverrides);
  const lessonId = uuidv5(`lesson:${course.slug}/${moduleSlug}/${lessonSlug}`);
  const lessonSequence = parseSequence(lessonSlug);
  recordSourceName(context, lessonId, `${keyPrefix}/${moduleSlug}/${lessonSlug}`, lessonFolder);

  const lessonDir = path.join(context.sourceDir, course.folder, moduleFolder, lessonFolder);
  const classified = classifyLessonFolder(lessonDir, lessonSlug, {
    titleFromNotesHeading: course.titleFromNotesModules.has(moduleSlug),
  });

  // Resolved once and threaded into both the lesson and its notes Resource:
  // they are titled from the same string, so they cannot drift apart. An
  // override outranks the heading and the slug alike.
  const title = course.lessonTitleOverrides[`${moduleSlug}/${lessonSlug}`] ?? classified.title;
  // Keys from classifyLessonFolder are lesson-relative; the BlobStore expects
  // keys relative to its `localRoot` (== sourceDir).
  const fullKey = (lessonRelativeKey: string): string =>
    `${keyPrefix}/${moduleSlug}/${lessonRelativeKey}`;

  const row = await buildLessonRow({
    classified,
    lessonId,
    courseId,
    moduleId,
    lessonSequence,
    title,
    lessonDir,
    fullKey,
    // An entry says this lesson's video is served by someone else, so the key
    // derived from the .mp4 on disk is not what the lesson should point at.
    // Absent — the ordinary case — nothing about the row changes.
    declaredVideoSource: course.lessonVideoSources[`${moduleSlug}/${lessonSlug}`],
  });
  resolveLessonRow(row, context.validationStore);
  context.seed.lessonRows.push(row);

  if (row.kind === "video") {
    // `seed.keys` is what the generator later checks with exists(). A declared
    // external source has no file under the content root, so checking it would
    // fail every hosted lesson. The poster is still a key and is still checked.
    if (!isAbsoluteHttpUrl(row.source)) context.seed.keys.push(row.source);
    if (row.poster) context.seed.keys.push(row.poster);
  }
  if (classified.kind === "video" && classified.readmeKey) {
    context.seed.notesKeys[lessonId] = fullKey(classified.readmeKey);
  }

  appendResources({ classified, lessonId, title, fullKey }, context);
}

/**
 * The lesson row for a classified folder — a video row (with its probed
 * duration and optional poster) or a reading row carrying the Markdown body.
 */
async function buildLessonRow(args: {
  classified: ClassifiedLesson;
  lessonId: string;
  courseId: string;
  moduleId: string;
  lessonSequence: number;
  title: string;
  lessonDir: string;
  fullKey: (lessonRelativeKey: string) => string;
  /** External URL for this lesson's video, when the manifest declares one. */
  declaredVideoSource: string | undefined;
}): Promise<LessonRow> {
  const {
    classified,
    lessonId,
    courseId,
    moduleId,
    lessonSequence,
    title,
    lessonDir,
    fullKey,
    declaredVideoSource,
  } = args;
  const common = {
    id: lessonId,
    courseId,
    moduleId,
    sequence: lessonSequence,
    title,
  };

  if (classified.kind !== "video") {
    return { kind: "reading", ...common, body: classified.body };
  }

  const posterKey = classified.posterKey ? fullKey(classified.posterKey) : null;
  return {
    kind: "video",
    ...common,
    description: classified.description,
    source: declaredVideoSource ?? fullKey(classified.videoKey),
    durationSeconds: await probeDurationSeconds(path.join(lessonDir, classified.videoFileName)),
    ...(posterKey ? { poster: posterKey } : {}),
  };
}

/** Appends one resource row per non-lesson file in the folder. */
function appendResources(
  args: {
    classified: ClassifiedLesson;
    lessonId: string;
    title: string;
    fullKey: (lessonRelativeKey: string) => string;
  },
  context: WalkContext,
): void {
  const { classified, lessonId, title, fullKey } = args;
  for (let i = 0; i < classified.resourceKeys.length; i++) {
    const key = fullKey(classified.resourceKeys[i] as string);
    const rawName = classified.resourceRawNames[i] as string;
    const resourceRow = buildResourceRow(lessonId, key, title);
    resolveResourceRow(resourceRow, context.validationStore);
    context.seed.resourceRows.push(resourceRow);
    // Priority for sourceNames: raw on-disk filename (always available
    // because classifyLessonFolder reads the folder at walk time) >
    // rename-manifest entry (legacy path) > current slugified basename.
    recordSourceName(context, resourceRow.id, key, rawName);
    context.seed.keys.push(key);
  }
}

/**
 * Records an entity's pre-normalization name, preferring the rename manifest
 * and falling back to the name currently on disk.
 */
function recordSourceName(
  context: WalkContext,
  id: string,
  slugRelPath: string,
  fallbackLeaf: string,
): void {
  context.seed.sourceNames[id] = context.originalNames.get(slugRelPath) ?? fallbackLeaf;
}

/** Courses by ladder position; modules and lessons by sequence; resources by lesson then title. */
function sortSeed(seed: SeedAccumulator): void {
  seed.courses.sort((a, b) => a.sequence - b.sequence);
  seed.modules.sort((a, b) => {
    if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId);
    return a.sequence - b.sequence;
  });
  seed.lessonRows.sort((a, b) => {
    if (a.moduleId !== b.moduleId) return a.moduleId.localeCompare(b.moduleId);
    return a.sequence - b.sequence;
  });
  seed.resourceRows.sort((a, b) => {
    if (a.lessonId !== b.lessonId) return a.lessonId.localeCompare(b.lessonId);
    return a.title.localeCompare(b.title);
  });
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

function renderSeedFile(seed: BuiltSeed): string {
  const { courses, modules, lessonRows, resourceRows, sourceNames, notesKeys } = seed;
  // One JSON object per entity keeps the diff readable when content
  // changes. `formatWithPrettier` normalizes the result before it is
  // written, so this only has to be valid TypeScript, not pretty.
  const renderJsonArray = <T>(items: ReadonlyArray<T>): string =>
    items.map((item) => JSON.stringify(item, null, 2).replace(/\n/g, "\n  ")).join(",\n  ");

  return `// AUTOGENERATED by scripts/generate-course-content-seed.ts. DO NOT EDIT.
// Re-run the generator after adding content under public/local-filesystem-lesson/,
// or after editing that folder's courses.manifest.json.
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

const _seedContentCourseRaw = [
  ${renderJsonArray(courses)},
];

export const seedContentCourses: ReadonlyArray<Course> = _seedContentCourseRaw.map((c) =>
  Course.parse(c),
);

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
