const COURSE_ROUTE_PREFIX = "/courses/";

// Anything that could make the browser leave the site or climb out of the
// course routes: a scheme, a protocol-relative or doubled slash, a backslash
// (read as a slash by browsers), or a `..` segment.
const UNSAFE_PATH_PATTERN = /:|\/\/|\\|(^|\/)\.\.(\/|$)/;

/**
 * Tells whether a value may be used as the course route a learner returns to
 * after the onboarding.
 *
 * @remarks
 * The onboarding carries the route it interrupted in a `next` query
 * parameter, which anyone can edit. Only locale-less course paths are
 * accepted, so a crafted value can never redirect off the site or onto a
 * non-course page.
 *
 * @example
 * ```ts
 * isCourseReturnPath("/courses/basics/modules/vowels"); // true
 * isCourseReturnPath("//evil.example/courses/c");       // false
 * ```
 *
 * @param value - The candidate path, without the locale prefix
 * @returns `true` when the value is a safe course path
 */
export function isCourseReturnPath(value: string): boolean {
  const hasCourseSegment = value.length > COURSE_ROUTE_PREFIX.length;
  return (
    value.startsWith(COURSE_ROUTE_PREFIX) && hasCourseSegment && !UNSAFE_PATH_PATTERN.test(value)
  );
}

/**
 * Builds an onboarding href that carries the course route to return to.
 *
 * @remarks
 * The return path is appended as an encoded `next` query parameter only when
 * {@link isCourseReturnPath} accepts it; otherwise the href is the bare path,
 * so an invalid value silently falls back to the onboarding's usual flow.
 *
 * @example
 * ```ts
 * withReturnPath("/start", "/courses/basics"); // "/start?next=%2Fcourses%2Fbasics"
 * withReturnPath("/start", undefined);         // "/start"
 * ```
 *
 * @param path - The locale-less onboarding path to navigate to
 * @param returnPath - The course route to come back to, if any
 * @returns The href to hand to the locale-aware router
 */
export function withReturnPath(path: string, returnPath: string | undefined): string {
  if (returnPath === undefined || !isCourseReturnPath(returnPath)) return path;
  return `${path}?next=${encodeURIComponent(returnPath)}`;
}
