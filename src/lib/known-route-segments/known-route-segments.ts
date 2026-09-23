/**
 * Every first path segment, after the locale, that the router can serve.
 *
 * @remarks
 * A literal tuple because the proxy runs before the router and has no
 * filesystem to read. `known-route-segments.test.ts` compares it against the
 * directories under `src/app/[locale]` on every run, so it cannot drift
 * silently: a route added on disk and forgotten here would start answering
 * 404, and one removed from disk but left here would let a missing page keep
 * answering 200.
 *
 * Route-group directories — `(account)` — contribute their children, since
 * parentheses never appear in a URL.
 *
 * @category Routing
 */
export const KNOWN_ROUTE_SEGMENTS = [
  "account-deleted",
  "achievements",
  "courses",
  "forgot-password",
  "learning",
  "privacy",
  "profile",
  "reset-password",
  "sign-in",
  "sign-up",
  "start",
  "terms",
] as const;

const SERVABLE = new Set<string>(KNOWN_ROUTE_SEGMENTS);

/**
 * Whether the router has a route for this path, judged by its first segment.
 *
 * @remarks
 * Only the first segment is examined, and deliberately. What follows is data,
 * not routing: an unknown course slug or lesson id is the application's
 * business, and it answers with an inline recovery state rather than a missing
 * page. Pre-empting that here would replace a helpful screen with a bare 404.
 *
 * The home — an empty path — is always known.
 *
 * @example
 * ```ts
 * isKnownRoutePath("/privacy");        // true
 * isKnownRoutePath("/courses/typo");   // true — the page explains it
 * isKnownRoutePath("/error");          // false
 * ```
 *
 * @param path - The path after the locale segment, leading slash included
 * @returns `true` when a route exists for it
 *
 * @category Routing
 */
export function isKnownRoutePath(path: string): boolean {
  const [firstSegment = ""] = path.replace(/^\//, "").split("/");
  return firstSegment === "" || SERVABLE.has(firstSegment);
}
