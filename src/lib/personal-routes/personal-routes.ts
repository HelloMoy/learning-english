const COURSE_ROUTE_PREFIX = "/courses/";

/** Personal routes that are a page of their own, with or without sub-pages. */
const PERSONAL_SECTIONS = ["/learning", "/achievements", "/profile", "/start"] as const;

/**
 * Whether a locale-less path belongs to a signed-in learner.
 *
 * @remarks
 * Every course, module and lesson route, plus My learning, Achievements,
 * Profile and the onboarding. The proxy sends a visitor without a session
 * away from these, and the pages verify the session again on the server.
 *
 * @example
 * ```ts
 * isPersonalPath("/courses/basics"); // true
 * isPersonalPath("/sign-in");        // false
 * ```
 *
 * @param path - The path without its locale prefix or query string
 * @returns `true` when the path requires a session
 *
 * @category Auth
 */
export function isPersonalPath(path: string): boolean {
  return isCoursePath(path) || PERSONAL_SECTIONS.some((section) => isWithin(path, section));
}

function isCoursePath(path: string): boolean {
  return path.startsWith(COURSE_ROUTE_PREFIX) && path.length > COURSE_ROUTE_PREFIX.length;
}

function isWithin(path: string, section: string): boolean {
  return path === section || path.startsWith(`${section}/`);
}
