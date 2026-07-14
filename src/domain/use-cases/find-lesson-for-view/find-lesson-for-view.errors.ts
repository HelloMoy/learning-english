/**
 * Domain errors emitted by `findLessonForView`.
 *
 * Every variant carries only fields the use case needs to describe what went
 * wrong — no HTTP status, no UI text. Adapters translate to delivery.
 */
export type FindLessonForViewErrors =
  | { kind: "course-not-found" }
  | { kind: "module-not-in-course" }
  | { kind: "lesson-not-in-module" }
  | { kind: "internal-error"; cause: unknown };
