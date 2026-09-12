export type UnmarkLessonCompleteErrors =
  { kind: "lesson-not-found" } | { kind: "internal-error"; cause: unknown };
