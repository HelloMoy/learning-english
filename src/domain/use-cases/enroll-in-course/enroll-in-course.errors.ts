/**
 * Discriminated union of errors raised by `enrollInCourse`.
 *
 * - `course-not-found` — the catalog does not serve that slug (unknown, or a
 *   draft hidden from this environment).
 * - `internal-error` — the course or enrollment repository rejected; `cause`
 *   carries the original rejection for observability.
 */
export type EnrollInCourseErrors =
  { kind: "course-not-found" } | { kind: "internal-error"; cause: unknown };
