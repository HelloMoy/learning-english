export type FindModuleForViewErrors =
  | { kind: "course-not-found" }
  | { kind: "module-not-in-course" }
  | { kind: "internal-error"; cause: unknown };
