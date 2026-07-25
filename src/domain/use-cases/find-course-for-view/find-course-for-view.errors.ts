export type FindCourseForViewErrors =
  { kind: "course-not-found" } | { kind: "internal-error"; cause: unknown };
