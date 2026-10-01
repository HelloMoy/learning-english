/** Personal routes: each is a page of its own, and so is everything under it. */
const PERSONAL_SECTIONS = ["/courses", "/learning", "/achievements", "/profile", "/start"] as const;

/**
 * Whether a locale-less path belongs to a signed-in learner.
 *
 * @remarks
 * Every course, module and lesson route, plus Available courses, My learning,
 * Achievements, Profile and the onboarding. The proxy sends a visitor without a session
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
  return PERSONAL_SECTIONS.some((section) => isWithin(path, section));
}

function isWithin(path: string, section: string): boolean {
  return path === section || path.startsWith(`${section}/`);
}
