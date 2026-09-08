import { assertSafeKey } from "@/adapters/persistence/blob-store/blob-key/blob-key";
import { CourseId, LessonId, ModuleId, ResourceId } from "@/domain/entities/ids/ids";
import { ResourceKind } from "@/domain/entities/resource/resource";
import { Slug } from "@/domain/entities/slug/slug";
import { isAbsoluteHttpUrl } from "@/domain/entities/url-or-path/url-or-path";

import { z } from "zod";

/**
 * Raised when a course manifest does not describe a servable catalog.
 *
 * @remarks
 * The manifests are hand-edited, so a failure has to say which lesson in which
 * course is wrong. A bare `ZodError` path (`modules.0.lessons.7.source`) names
 * a position, not a lesson, which is useless in a 48-lesson file.
 *
 * @category Content manifest
 */
export class InvalidCourseManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCourseManifestError";
  }
}

/**
 * Whether a value is a content key the `BlobStore` family will accept.
 *
 * @remarks
 * Delegates to {@link assertSafeKey}, the one definition of key safety shared
 * by every store driver, rather than restating its rules. A second definition
 * here could drift and let the manifest declare a key the store then refuses.
 */
function isSafeContentKey(value: string): boolean {
  try {
    assertSafeKey(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * A manifest value that addresses an asset: either a content key resolved
 * through `BlobStore`, or an absolute `http(s)` URL used verbatim.
 *
 * @remarks
 * Which one it is is decided by the value's own shape, exactly as
 * `resolveContentValue` decides it at read time. Declaring the same rule in
 * both places is what keeps a lesson served by YouTube from being prefixed
 * with the store's base.
 */
const assetReference = () =>
  z
    .string()
    .min(1)
    .refine(
      (value) => isAbsoluteHttpUrl(value) || isSafeContentKey(value),
      "Must be an absolute http(s) URL or a safe content key (relative, no '..' segments)",
    );

const ManifestResource = z.object({
  id: ResourceId,
  title: z.string().min(1),
  url: assetReference(),
  kind: ResourceKind,
});

const lessonFields = {
  id: LessonId,
  /** The lesson's on-disk folder name. Not used to serve — the id addresses a
   * lesson — but it is how a human and the sync command locate the folder. */
  slug: Slug,
  sequence: z.number().int().positive(),
  title: z.string().min(1),
  resources: z.array(ManifestResource).default([]),
};

const ManifestVideoLesson = z.object({
  ...lessonFields,
  kind: z.literal("video"),
  description: z.string().min(1),
  source: assetReference(),
  durationSeconds: z.number().int().positive(),
  poster: assetReference().optional(),
  /** Key of the lesson's Markdown notes, read by `LessonNotesRepository`. */
  notesKey: assetReference().optional(),
});

const ManifestReadingLesson = z.object({
  ...lessonFields,
  kind: z.literal("reading"),
  body: z.string().min(1),
});

const ManifestLesson = z.discriminatedUnion("kind", [ManifestVideoLesson, ManifestReadingLesson]);

const ManifestModule = z.object({
  id: ModuleId,
  slug: Slug,
  title: z.string().min(1),
  sequence: z.number().int().positive(),
  lessons: z.array(ManifestLesson).min(1),
});

/**
 * One course, declared in full: `src/content/<course-slug>.json`.
 *
 * @remarks
 * `lessonCount` and `moduleCount` are deliberately absent. They are derived
 * from the nesting when the manifest is flattened, so they cannot disagree with
 * the lessons actually declared. Likewise `courseId` and `moduleId` are absent
 * from the nested rows — position in the tree already says what they are.
 *
 * @category Content manifest
 */
export const CourseManifest = z.object({
  id: CourseId,
  slug: Slug,
  title: z.string().min(1),
  description: z.string().min(1),
  language: z
    .string()
    .length(2)
    .regex(/^[a-z]{2}$/, "ISO 639-1 lower-case"),
  sequence: z.number().int().positive(),
  /**
   * Whether the course is still being written. A draft course is withheld from
   * the served catalog in environments that hide drafts — see
   * `visibleCourseManifests`.
   *
   * Absent means published, so a manifest written before drafts existed keeps
   * its meaning untouched. Publishing a draft is deleting this line: no code
   * changes, and the course is served everywhere.
   */
  draft: z.boolean().default(false),
  modules: z.array(ManifestModule).min(1),
});

export type CourseManifest = z.infer<typeof CourseManifest>;
export type ManifestModule = CourseManifest["modules"][number];
export type ManifestLesson = ManifestModule["lessons"][number];
export type ManifestResource = ManifestLesson["resources"][number];

/**
 * The slug of the innermost node along `path` that carries one.
 *
 * @remarks
 * Turns a positional Zod path into something a person can search the file for:
 * `modules.0.lessons.7.source` becomes the lesson slug `4-fast-ae`.
 */
function slugAlong(raw: unknown, path: ReadonlyArray<PropertyKey>): string | undefined {
  let node: unknown = raw;
  let slug: string | undefined;
  for (const segment of path) {
    if (node === null || typeof node !== "object") break;
    node = (node as Record<PropertyKey, unknown>)[segment];
    const candidate = (node as { slug?: unknown } | null)?.slug;
    if (typeof candidate === "string") slug = candidate;
  }
  return slug;
}

/** One Zod issue, rendered with the lesson or module it belongs to. */
function describeIssue(raw: unknown, issue: z.core.$ZodIssue): string {
  const location = slugAlong(raw, issue.path);
  const field = issue.path.join(".");
  return location === undefined
    ? `  ${field}: ${issue.message}`
    : `  ${location} (${field}): ${issue.message}`;
}

function parseOne(raw: unknown, index: number): CourseManifest {
  const result = CourseManifest.safeParse(raw);
  if (result.success) return result.data;

  const slug = (raw as { slug?: unknown } | null)?.slug;
  const name = typeof slug === "string" ? slug : `manifest #${index}`;
  const details = result.error.issues.map((issue) => describeIssue(raw, issue)).join("\n");
  throw new InvalidCourseManifestError(`Course "${name}" is not servable:\n${details}`);
}

/** Course slugs that appear more than once under `pick`. */
function duplicatesBy<T>(
  courses: ReadonlyArray<CourseManifest>,
  pick: (course: CourseManifest) => T,
): Map<T, string[]> {
  const byValue = new Map<T, string[]>();
  for (const course of courses) {
    const value = pick(course);
    byValue.set(value, [...(byValue.get(value) ?? []), course.slug]);
  }
  return new Map([...byValue].filter(([, slugs]) => slugs.length > 1));
}

function assertLadderIsUnique(courses: ReadonlyArray<CourseManifest>): void {
  const collisions = [
    ...[...duplicatesBy(courses, (course) => course.slug)].map(
      ([slug, slugs]) => `  slug "${String(slug)}" is declared by ${slugs.length} manifests`,
    ),
    ...[...duplicatesBy(courses, (course) => course.sequence)].map(
      ([sequence, slugs]) => `  sequence ${String(sequence)} is claimed by ${slugs.join(", ")}`,
    ),
  ];
  if (collisions.length > 0) {
    throw new InvalidCourseManifestError(`Course ladder is ambiguous:\n${collisions.join("\n")}`);
  }
}

/**
 * Validates the full set of course manifests and returns them in declaration
 * order.
 *
 * @remarks
 * Uniqueness of `slug` and `sequence` is checked here rather than inside
 * {@link CourseManifest}, because no single file can see the others. Everything
 * else is a per-file concern and fails during that file's parse.
 *
 * @param raw - The imported manifest documents, in ladder order
 * @returns The parsed courses, same order
 * @throws {@link InvalidCourseManifestError} naming the offending lesson or
 *         the colliding courses
 * @category Content manifest
 */
export function parseCourseManifests(raw: ReadonlyArray<unknown>): ReadonlyArray<CourseManifest> {
  const courses = raw.map(parseOne);
  assertLadderIsUnique(courses);
  return courses;
}
