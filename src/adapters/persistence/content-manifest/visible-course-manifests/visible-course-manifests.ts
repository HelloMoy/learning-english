import type { CourseManifest } from "@/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema";

/**
 * Raised when `SHOW_DRAFT_COURSES` holds a value that is neither a yes nor a no.
 *
 * @remarks
 * `SHOW_DRAFT_COURSES=treu` falling back to "hide" would silently remove a
 * course from a developer's catalog and give them nothing to search for. The
 * error names the variable and the value so the typo is the first thing read.
 *
 * @category Content manifest
 */
export class InvalidDraftVisibilityError extends Error {
  constructor(value: string) {
    super(
      `SHOW_DRAFT_COURSES must be one of 1, true, 0, false (or unset); received "${value}". ` +
        `Unset means drafts show whenever NODE_ENV is not "production".`,
    );
    this.name = "InvalidDraftVisibilityError";
  }
}

const AFFIRMATIVE = new Set(["1", "true"]);
const NEGATIVE = new Set(["0", "false"]);

/**
 * The two variables the visibility decision reads, and nothing else.
 *
 * @remarks
 * Narrower than `NodeJS.ProcessEnv` on purpose: `process.env` satisfies it, and
 * a test can satisfy it with an object literal naming only what the case is
 * about.
 *
 * @category Content manifest
 */
export type DraftVisibilityEnv = {
  NODE_ENV?: string | undefined;
  SHOW_DRAFT_COURSES?: string | undefined;
};

/**
 * Whether draft courses are served in the given environment.
 *
 * @remarks
 * | `SHOW_DRAFT_COURSES`     | Result                                |
 * | ------------------------ | ------------------------------------- |
 * | unset or empty           | `NODE_ENV !== "production"`           |
 * | `1`, `true` (any case)   | shown                                 |
 * | `0`, `false` (any case)  | hidden                                |
 * | anything else            | throws {@link InvalidDraftVisibilityError} |
 *
 * The default is what makes the flag free to live with: `pnpm dev`,
 * `pnpm test:run`, Storybook and Playwright against a dev server all see draft
 * courses with no configuration, while a production build hides them. The
 * explicit values cover the two cases the default cannot — reviewing a draft in
 * a production build, and checking the production catalog locally.
 *
 * Takes the environment as an argument rather than reading `process.env`, so the
 * whole decision table is testable without mutating the real environment.
 *
 * @param env - The environment to read `SHOW_DRAFT_COURSES` and `NODE_ENV` from
 * @returns `true` when draft courses are part of the served catalog
 * @throws {@link InvalidDraftVisibilityError} when the flag is set to an
 *         unrecognized value
 * @category Content manifest
 */
export function shouldShowDraftCourses(env: DraftVisibilityEnv): boolean {
  const declared = env.SHOW_DRAFT_COURSES?.trim().toLowerCase() ?? "";
  if (declared === "") return env.NODE_ENV !== "production";
  if (AFFIRMATIVE.has(declared)) return true;
  if (NEGATIVE.has(declared)) return false;
  throw new InvalidDraftVisibilityError(env.SHOW_DRAFT_COURSES ?? "");
}

/**
 * The course manifests the application serves: every declared course, minus the
 * drafts when {@link shouldShowDraftCourses} says to hide them.
 *
 * @remarks
 * Filtering the manifests *before* they are flattened is what makes every
 * catalog surface agree without any of them knowing about drafts. A withheld
 * course contributes no `Course`, so `CourseRepository.bySlug` returns `null`
 * and the existing not-found state answers its URLs; it also contributes no
 * module, lesson row, resource row or notes key, so nothing of it stays
 * addressable by id.
 *
 * This is a visibility filter over the one source, not a second source: the
 * decision reads each manifest's own `draft` field, so no configuration can
 * introduce a course the manifests do not declare.
 *
 * Temporary by design.
 * `openspec/changes/archive/2026-09-08-hide-draft-courses-in-production/design.md`
 * carries the removal recipe: deleting `"draft": true` from a manifest publishes
 * that course with no code change, and deleting this folder plus the one call in
 * `content-manifest.ts` removes the flag entirely.
 *
 * @param courses - The parsed manifests, in ladder order
 * @returns The manifests to serve, order preserved
 * @throws {@link InvalidDraftVisibilityError} when `SHOW_DRAFT_COURSES` is set
 *         to an unrecognized value
 * @category Content manifest
 */
export function visibleCourseManifests(
  courses: ReadonlyArray<CourseManifest>,
): ReadonlyArray<CourseManifest> {
  if (shouldShowDraftCourses(process.env)) return courses;
  return courses.filter((course) => !course.draft);
}
