import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { humanize } from "../discriminate-lesson";
import { toPosix } from "../resolve-slug";
import { slugify } from "../slug";

/**
 * A hand-written title.
 *
 * @remarks
 * Unlike titles adopted from a `readme.md` heading, override values are not
 * normalized — they are rejected instead, so the table stays honest rather
 * than being silently repaired.
 */
const ReviewedTitle = z
  .string()
  .min(1)
  .refine((title) => !title.includes("'"), "must use ’ (U+2019), not the straight apostrophe")
  .refine((title) => title === title.trim(), "must be trimmed");

/**
 * Lesson-title overrides for one course, keyed by `moduleSlug/lessonSlug`.
 *
 * @remarks
 * A key is never a bare lesson slug — `1-intro` exists in most modules and
 * would rename all of them at once — and never course-prefixed either: the
 * course is already the entry the table lives under, so repeating it would let
 * a key name a course other than its own.
 *
 * The key shape is checked in a `superRefine` rather than on the record's key
 * schema because Zod reports a key-schema failure as the opaque "Invalid key
 * in record", which tells the author nothing about what a key should look like.
 */
const LessonTitleOverrides = z
  .record(z.string().min(1), ReviewedTitle)
  .superRefine((table, ctx) => {
    for (const key of Object.keys(table)) {
      if (key.split("/").length !== 2) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `"${key}" must be a moduleSlug/lessonSlug pair`,
        });
      }
    }
  });

/**
 * Declaration of one course, exactly as written in `courses.manifest.json`.
 *
 * @remarks
 * Only `folder` and `sequence` are required, because they are the two facts
 * no amount of walking the content tree can supply: which directory holds the
 * course, and where the course sits on the home's ladder of levels. Everything
 * else has a derivable default — see {@link resolveCourseDeclaration}.
 */
export const CourseDeclaration = z.object({
  /** Directory name under the content root. */
  folder: z.string().min(1),
  /** Position in the home ladder, 1-based. Unique across the manifest. */
  sequence: z.number().int().positive(),
  /** URL slug. Defaults to `slugify(folder)`. */
  slug: z.string().min(3).optional(),
  /** Display title. Defaults to `humanize(slug)`. */
  title: z.string().min(1).optional(),
  /** Catalog description. Defaults to a sentence naming the content root. */
  description: z.string().min(1).optional(),
  /** ISO 639-1 code. Defaults to `"en"`. */
  language: z
    .string()
    .length(2)
    .regex(/^[a-z]{2}$/, "ISO 639-1 lower-case")
    .optional(),
  /**
   * Raw on-disk folder name → slug, applied before automatic slugification.
   *
   * Add an entry when the automatic slug is valid but wrong for the reader:
   * it is ugly, it is inconsistent with its siblings (`1 Day#1` and `3 Day# 3`
   * auto-slug to `1-day-1` and `3-day-3` where `1-day-01` reads better), or
   * two sibling folders auto-slug to the same string. An absent entry is a
   * deliberate choice to accept the automatic slug.
   */
  slugOverrides: z.record(z.string().min(1), z.string().min(3)).optional(),
  /**
   * Module slugs whose lesson titles come from each lesson's `readme.md`
   * heading instead of its folder slug.
   *
   * Slugification is lossy: it strips IPA notation, apostrophes and
   * punctuation, so eight sibling folders can collapse to the same word. The
   * heading is what recovers them.
   *
   * The allowlist is per-module, never global, because adopting a module's
   * headings adopts whatever inconsistencies they carry — mixed `Day#1` /
   * `Day# 3` spellings, section labels used as headings, outright typos.
   * **Adding an entry commits you to having read that module's headings**,
   * then re-running the generator and reviewing the diff: only titles should
   * move.
   */
  titleFromNotesModules: z.array(z.string().min(1)).optional(),
  /**
   * `moduleSlug/lessonSlug` → title, for lessons no automatic source can name.
   *
   * An override beats both the heading and the slug, and applies whether or
   * not its module is allowlisted — the allowlist gates an *automatic* source
   * that needs a module-wide review, while an entry here is already a
   * per-lesson reviewed decision.
   *
   * That precedence has a cost: if a lesson listed here later gains a
   * `readme.md`, its heading stays ignored until the entry is deleted.
   */
  lessonTitleOverrides: LessonTitleOverrides.optional(),
});

export type CourseDeclaration = z.infer<typeof CourseDeclaration>;

/**
 * The `courses.manifest.json` document: a versioned list of course declarations.
 */
export const CoursesManifest = z.object({
  version: z.literal(1),
  courses: z.array(CourseDeclaration).min(1),
});

export type CoursesManifest = z.infer<typeof CoursesManifest>;

/**
 * Parses the text of a `courses.manifest.json` into a validated manifest.
 *
 * @remarks
 * Throws rather than returning a `Result`: this runs in build-time tooling
 * where the only sane response to an unreadable manifest is to abort the
 * generation, which is what the sibling scripts already do.
 *
 * @param text - Raw file contents
 * @returns The validated manifest
 * @throws if `text` is not valid JSON, or does not satisfy the schema
 */
export function parseCoursesManifest(text: string): CoursesManifest {
  const parsed = CoursesManifest.safeParse(readJson(text));
  if (!parsed.success) {
    throw new Error(`courses.manifest.json is invalid:\n${describeIssues(parsed.error)}`);
  }
  return parsed.data;
}

function readJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new Error("courses.manifest.json is not valid JSON", { cause });
  }
}

function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n");
}

/**
 * A course declaration with every optional field resolved to a concrete value.
 *
 * @remarks
 * This is what the generator and the disk normalizer consume, so neither has
 * to know which fields the author chose to write down.
 */
export type ResolvedCourse = {
  folder: string;
  slug: string;
  title: string;
  description: string;
  language: string;
  sequence: number;
  slugOverrides: Record<string, string>;
  titleFromNotesModules: ReadonlySet<string>;
  lessonTitleOverrides: Record<string, string>;
};

/**
 * Fills in every field the author left out of a course declaration.
 *
 * @remarks
 * The derived values reproduce exactly what the generator hardcoded before
 * the manifest existed, so a content root with no manifest — and one whose
 * manifest declares only the required fields — produce the same course.
 *
 * @param declaration - One entry from the manifest's `courses` array
 * @param contentRoot - Path to the content root, used only for the default description
 * @returns The declaration with all defaults applied
 */
export function resolveCourseDeclaration(
  declaration: CourseDeclaration,
  contentRoot: string,
): ResolvedCourse {
  const slug = declaration.slug ?? slugify(declaration.folder);
  return {
    folder: declaration.folder,
    slug,
    title: declaration.title ?? humanize(slug),
    description: declaration.description ?? defaultDescription(contentRoot),
    language: declaration.language ?? "en",
    sequence: declaration.sequence,
    slugOverrides: declaration.slugOverrides ?? {},
    titleFromNotesModules: new Set(declaration.titleFromNotesModules ?? []),
    lessonTitleOverrides: declaration.lessonTitleOverrides ?? {},
  };
}

/**
 * The catalog description used when a course declares none.
 *
 * Relative to the repo root, never absolute: an absolute path would bake one
 * machine's home directory into the committed seed.
 */
function defaultDescription(contentRoot: string): string {
  return `Course content generated from ${toPosix(path.relative(process.cwd(), contentRoot))}.`;
}

/** File name the manifest is always read from, at the content root. */
export const COURSES_MANIFEST_FILE = "courses.manifest.json";

/**
 * Reads and resolves the manifest sitting at the root of a content tree.
 *
 * @remarks
 * Absence and invalidity mean different things. A content root with no
 * manifest is one that has not been configured yet, and callers fall back to
 * their pre-manifest behaviour — hence `null` rather than an empty array or a
 * throw. A manifest that exists but does not describe the disk is an authoring
 * mistake, and aborts.
 *
 * @param contentRoot - Directory holding the course folders
 * @returns The resolved courses in ladder order, or `null` when no manifest exists
 * @throws if the manifest is invalid, or declares a folder that is not on disk
 */
export function loadCoursesManifest(contentRoot: string): ResolvedCourse[] | null {
  const manifestPath = path.join(contentRoot, COURSES_MANIFEST_FILE);
  if (!existsSync(manifestPath)) return null;

  const courses = resolveCoursesManifest(readFileSync(manifestPath, "utf8"), contentRoot);
  const missing = courses.filter((course) => !isDirectory(path.join(contentRoot, course.folder)));
  if (missing.length > 0) {
    throw new Error(
      `${COURSES_MANIFEST_FILE} declares folders that are not in ${contentRoot}: ${missing
        .map((course) => course.folder)
        .join(", ")}`,
    );
  }
  return courses;
}

function isDirectory(candidate: string): boolean {
  return existsSync(candidate) && statSync(candidate).isDirectory();
}

/**
 * Parses manifest text into resolved courses, ordered by ladder position.
 *
 * @remarks
 * Collision checks run on RESOLVED slugs, not declared ones, because two
 * folders can slugify to the same value without either declaring a slug.
 *
 * @param text - Raw contents of `courses.manifest.json`
 * @param contentRoot - Path to the content root
 * @returns The declared courses, defaults applied, sorted by `sequence`
 * @throws if the manifest is invalid, or two courses share a slug or a sequence
 */
export function resolveCoursesManifest(text: string, contentRoot: string): ResolvedCourse[] {
  const courses = parseCoursesManifest(text).courses.map((declaration) =>
    resolveCourseDeclaration(declaration, contentRoot),
  );
  assertUnique(courses, "slug", (course) => course.slug);
  assertUnique(courses, "sequence", (course) => String(course.sequence));
  return [...courses].sort((a, b) => a.sequence - b.sequence);
}

/**
 * Fails when two courses share the value a field is supposed to identify them
 * by, naming every folder involved so the author can find them on disk.
 */
function assertUnique(
  courses: ResolvedCourse[],
  field: string,
  valueOf: (course: ResolvedCourse) => string,
): void {
  const foldersByValue = new Map<string, string[]>();
  for (const course of courses) {
    const value = valueOf(course);
    foldersByValue.set(value, [...(foldersByValue.get(value) ?? []), course.folder]);
  }
  for (const [value, folders] of foldersByValue) {
    if (folders.length > 1) {
      throw new Error(
        `courses.manifest.json declares ${field} "${value}" more than once: ${folders.join(", ")}`,
      );
    }
  }
}
