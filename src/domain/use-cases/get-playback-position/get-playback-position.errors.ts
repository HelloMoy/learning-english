/**
 * Discriminated union of errors raised by `getPlaybackPosition`.
 *
 * - `internal-error` — the playback-position repository rejected; the
 *   `cause` carries the original rejection for observability.
 */
export type GetPlaybackPositionErrors = {
  kind: "internal-error";
  cause: unknown;
};
