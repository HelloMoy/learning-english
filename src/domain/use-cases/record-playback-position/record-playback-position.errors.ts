/**
 * Discriminated union of errors raised by `recordPlaybackPosition`.
 *
 * - `lesson-not-found` — the lookup returned `null`.
 * - `internal-error` — the lessons repository or the playback-position
 *   repository rejected; the `cause` carries the original rejection for
 *   observability.
 */
export type RecordPlaybackPositionErrors =
  { kind: "lesson-not-found" } | { kind: "internal-error"; cause: unknown };
