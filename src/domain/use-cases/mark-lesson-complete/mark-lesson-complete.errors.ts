export type MarkLessonCompleteErrors =
  { kind: "lesson-not-found" } | { kind: "internal-error"; cause: unknown };
