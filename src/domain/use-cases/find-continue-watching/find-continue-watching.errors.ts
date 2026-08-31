/**
 * Domain errors emitted by `findContinueWatching`.
 *
 * The three "not found" variants all describe the same situation from the
 * caller's point of view — a stored location that no longer resolves — but
 * they stay distinct because the domain models what went wrong, not what the
 * home decides to do about it. The home renders nothing for all of them.
 */
export type FindContinueWatchingErrors =
  | { kind: "course-not-found" }
  | { kind: "module-not-in-course" }
  | { kind: "lesson-not-in-module" }
  | { kind: "internal-error"; cause: unknown };
