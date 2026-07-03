/**
 * Discriminated union of domain errors emitted by `findNextLessonToRecommend`.
 *
 * Each variant has a `kind` string and any structured fields the use case
 * needs to describe what went wrong. The shape carries no information about
 * HTTP, UI, or any delivery mechanism — adapters translate these to whatever
 * the actor expects.
 */
export type FindNextLessonErrors =
  | { kind: "course-not-found" }
  | { kind: "lesson-not-in-course" }
  | { kind: "internal-error"; cause: unknown };
