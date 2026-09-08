/**
 * Appends lessons found on disk that the course manifests do not yet describe.
 *
 * This is NOT a generator: it never produces the catalog, and it never
 * overwrites, reorders or removes anything already declared. The manifests
 * under `src/content/` are the source of truth; this command exists only so
 * that adding a lesson does not mean hand-writing a UUIDv5.
 *
 * Usage:
 *   pnpm sync:manifest [--content public/local-filesystem-lesson] [--out src/content]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  classifyLessonFolder,
  listLessonFolders,
  listSubdirectories,
  parseSequence,
} from "../discriminate-lesson.ts";
import { probeDurationSeconds } from "../ffprobe.ts";
import { resolveSlug } from "../resolve-slug.ts";
import { uuidv5 } from "../uuid.ts";

/** A lesson folder on disk, rendered in manifest shape, with its module's identity. */
export type DiscoveredLesson = {
  moduleId: string;
  moduleSlug: string;
  moduleTitle: string;
  moduleSequence: number;
  lesson: Record<string, unknown>;
};

/** What one merge changed, for the human reading the command's output. */
export type MergeReport = {
  manifest: Record<string, unknown>;
  /** `moduleSlug/lessonSlug` of each lesson appended. */
  appendedLessons: string[];
  /** Slug of each module appended because no declared one held the lesson. */
  appendedModules: string[];
  /** `moduleSlug/lessonSlug` of appended lessons whose duration is unknown. */
  lessonsMissingDuration: string[];
};

type MutableModule = Record<string, unknown> & { lessons: Array<Record<string, unknown>> };

function modulesOf(manifest: Record<string, unknown>): MutableModule[] {
  return manifest.modules as MutableModule[];
}

function declaredLessonIds(manifest: Record<string, unknown>): Set<string> {
  return new Set(
    modulesOf(manifest).flatMap((courseModule) =>
      courseModule.lessons.map((lesson) => String(lesson.id)),
    ),
  );
}

/** The declared module with `slug`, appending one when none matches. */
function moduleFor(
  manifest: Record<string, unknown>,
  found: DiscoveredLesson,
  report: MergeReport,
): MutableModule {
  const existing = modulesOf(manifest).find(
    (courseModule) => courseModule.slug === found.moduleSlug,
  );
  if (existing) return existing;

  const appended: MutableModule = {
    id: found.moduleId,
    slug: found.moduleSlug,
    title: found.moduleTitle,
    sequence: found.moduleSequence,
    lessons: [],
  };
  modulesOf(manifest).push(appended);
  report.appendedModules.push(found.moduleSlug);
  return appended;
}

/**
 * Appends every discovered lesson the manifest does not already declare.
 *
 * @remarks
 * Append-only by construction: the only mutations are `push` onto a module's
 * `lessons` and onto the manifest's `modules`. A lesson whose id is already
 * declared is skipped entirely — not compared, not reconciled — which is what
 * lets a hand-edited title or a YouTube `source` survive every future run.
 *
 * Identity is the lesson's id, not its slug or its position. The id is derived
 * from the same UUIDv5 scheme the previous generator used, so a lesson that was
 * migrated and one that this command appends are indistinguishable.
 *
 * @param manifest - The course manifest document, mutated in place
 * @param discovered - Lessons found on disk, in the order they should append
 * @returns The manifest and what changed
 */
export function mergeDiscoveredLessons(
  manifest: Record<string, unknown>,
  discovered: ReadonlyArray<DiscoveredLesson>,
): MergeReport {
  const report: MergeReport = {
    manifest,
    appendedLessons: [],
    appendedModules: [],
    lessonsMissingDuration: [],
  };
  const alreadyDeclared = declaredLessonIds(manifest);

  for (const found of discovered) {
    if (alreadyDeclared.has(String(found.lesson.id))) continue;

    moduleFor(manifest, found, report).lessons.push(found.lesson);
    const location = `${found.moduleSlug}/${String(found.lesson.slug)}`;
    report.appendedLessons.push(location);
    if (found.lesson.durationSeconds === null) report.lessonsMissingDuration.push(location);
  }

  return report;
}

/**
 * Walks one course's folder and renders every lesson in manifest shape.
 *
 * @remarks
 * Classification still comes from {@link classifyLessonFolder} — it encodes the
 * on-disk conventions (video/image/readme) and there is no reason to restate
 * them. What changed is its authority: it no longer decides what the app
 * serves, only what this command proposes appending.
 *
 * A folder with no video yields `durationSeconds: null` rather than a guess.
 * The manifest schema rejects `null`, so the run reports it and a human fills
 * it in — a wrong duration renders as a broken progress bar and reads as a
 * player bug.
 */
export async function discoverLessons(
  courseDir: string,
  courseSlug: string,
  slugOverrides: Readonly<Record<string, string>> = {},
): Promise<DiscoveredLesson[]> {
  const discovered: DiscoveredLesson[] = [];

  for (const moduleFolder of listSubdirectories(courseDir)) {
    const moduleSlug = resolveSlug(moduleFolder, slugOverrides);
    const moduleIdentity = {
      moduleId: uuidv5(`module:${courseSlug}/${moduleSlug}`),
      moduleSlug,
      moduleTitle: moduleFolder,
      moduleSequence: parseSequence(moduleSlug),
    };

    for (const lessonFolder of listLessonFolders(path.join(courseDir, moduleFolder))) {
      const lessonDir = path.join(courseDir, moduleFolder, lessonFolder);
      const lessonSlug = resolveSlug(lessonFolder, slugOverrides);
      const lesson = await renderLesson({
        lessonDir,
        lessonSlug,
        keyPrefix: `${courseSlug}/${moduleSlug}/${lessonSlug}`,
        lessonId: uuidv5(`lesson:${courseSlug}/${moduleSlug}/${lessonSlug}`),
      });
      discovered.push({ ...moduleIdentity, lesson });
    }
  }

  return discovered;
}

async function renderLesson(args: {
  lessonDir: string;
  lessonSlug: string;
  keyPrefix: string;
  lessonId: string;
}): Promise<Record<string, unknown>> {
  const { lessonDir, lessonSlug, keyPrefix, lessonId } = args;
  const classified = classifyLessonFolder(lessonDir, lessonSlug);
  const common = {
    id: lessonId,
    slug: lessonSlug,
    sequence: parseSequence(lessonSlug),
    title: classified.title,
  };

  if (classified.kind === "reading") {
    return { ...common, kind: "reading", body: classified.body, resources: [] };
  }

  return {
    ...common,
    kind: "video",
    description: classified.description,
    source: `${keyPrefix}/${path.basename(classified.videoKey)}`,
    durationSeconds: await durationOf(path.join(lessonDir, classified.videoFileName)),
    ...(classified.posterKey === null
      ? {}
      : { poster: `${keyPrefix}/${path.basename(classified.posterKey)}` }),
    ...(classified.readmeKey === null
      ? {}
      : { notesKey: `${keyPrefix}/${path.basename(classified.readmeKey)}` }),
    resources: [],
  };
}

/** The video's duration, or `null` when ffprobe cannot answer. */
async function durationOf(videoPath: string): Promise<number | null> {
  try {
    return await probeDurationSeconds(videoPath);
  } catch {
    return null;
  }
}

function readManifest(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

function readFlag(argv: ReadonlyArray<string>, flag: string, fallback: string): string {
  const at = argv.indexOf(flag);
  return at >= 0 && argv[at + 1] ? (argv[at + 1] as string) : fallback;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const contentRoot = readFlag(argv, "--content", "public/local-filesystem-lesson");
  const outDir = readFlag(argv, "--out", "src/content");

  const { courseManifests } = (await import("../../src/content/courses.ts")) as {
    courseManifests: ReadonlyArray<{ slug: string }>;
  };

  for (const { slug } of courseManifests) {
    const file = path.join(outDir, `${slug}.json`);
    const discovered = await discoverLessons(path.join(contentRoot, slug), slug);
    const report = mergeDiscoveredLessons(readManifest(file), discovered);

    if (report.appendedLessons.length === 0 && report.appendedModules.length === 0) {
      console.log(`${slug}: up to date`);
      continue;
    }
    writeFileSync(file, `${JSON.stringify(report.manifest, null, 2)}\n`);
    console.log(
      `${slug}: +${report.appendedLessons.length} lessons, +${report.appendedModules.length} modules`,
    );
    for (const location of report.lessonsMissingDuration) {
      console.warn(
        `  ${location}: no duration — set durationSeconds by hand before this validates`,
      );
    }
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  void main();
}
