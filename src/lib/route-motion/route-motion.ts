import { routing } from "@/i18n/routing";

/**
 * Every motion a route change can play, in the order the stylesheet declares
 * them.
 *
 * @remarks
 * `globals.css` has one `::view-transition-old/new(.route-<motion>)` pair per
 * entry, and `RouteTransition` maps one transition type to each. Adding a
 * motion here without its rules leaves that route change as a hard cut.
 *
 * @category Routing
 */
export const ROUTE_MOTIONS = [
  "slide-forward",
  "slide-back",
  "depth-in",
  "depth-out",
  "rise",
  "sink",
  "fade",
] as const;

/**
 * How the page content moves when the learner goes from one route to another.
 *
 * @category Routing
 */
export type RouteMotion = (typeof ROUTE_MOTIONS)[number];

/**
 * A navigation target in either shape `Link` and the router take: a path, or
 * an object whose `pathname` is the path.
 *
 * @category Routing
 */
export type RouteHref = string | { pathname?: string | null };

type AppPlace = { area: "app"; depth: number; order: number };
type OnboardingPlace = { area: "onboarding"; order: number };
type RoutePlace = AppPlace | OnboardingPlace | { area: "account" } | { area: "unplaced" };

const SECTIONS = ["/", "/learning", "/courses", "/achievements", "/profile"];
const ONBOARDING_STEPS = ["/start", "/start/avatar", "/start/first-course"];
const ACCOUNT_PAGES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/account-deleted",
];
const COURSE_PAGES = ["about", "progress"];

const UNPLACED: RoutePlace = { area: "unplaced" };

/**
 * Chooses the motion for a route change from the two routes it connects.
 *
 * @remarks
 * The rule reads where each route sits in the app rather than which link was
 * followed, because the same link component is rendered at different depths:
 * a "Resume" tile goes deeper from My learning and sideways from another
 * lesson.
 *
 * - Sections, course pages and onboarding steps slide in their own order.
 * - A deeper level of the course tree goes in; a shallower one comes out.
 * - Account pages rise when entered from the app and slide between each other.
 * - Leaving the account or onboarding flow for the app sinks.
 * - A route with no place — legal pages, unknown paths — fades.
 *
 * Locale prefixes, query strings, hashes and trailing slashes are ignored, so
 * a raw `location.pathname` is as good an input as a locale-less `href`.
 *
 * @example
 * ```ts
 * routeMotion("/learning", "/courses");                    // "slide-forward"
 * routeMotion("/courses", "/courses/basic-course/about");  // "depth-in"
 * routeMotion("/es/profile", "/es/sign-in");               // "rise"
 * routeMotion("/sign-in", "/sign-in?reset=done");          // "none"
 * ```
 *
 * @param from - The route being left
 * @param to - The route being entered
 * @returns The motion to play, or `"none"` when both are the same route
 *
 * @category Routing
 */
export function routeMotion(from: string, to: string): RouteMotion | "none" {
  const originRoute = routeOf(from);
  const destinationRoute = routeOf(to);
  if (originRoute === destinationRoute) return "none";
  return motionBetween(placeOf(originRoute), placeOf(destinationRoute));
}

/**
 * The transition type a navigation carries for a motion.
 *
 * @remarks
 * The same string is the view-transition class its CSS rules select, which is
 * what keeps the type, the class map and the stylesheet from drifting apart.
 *
 * @param motion - The motion to name
 * @returns `route-<motion>`
 *
 * @category Routing
 */
export function routeTransitionType(motion: RouteMotion): string {
  return `route-${motion}`;
}

/**
 * The `transitionTypes` a navigation between two routes should carry.
 *
 * @remarks
 * Shaped for `Link` and `router.push`: an empty list means "navigate as
 * before", which is also the answer when either side is unknown — a link
 * rendered outside the App Router has no current pathname.
 *
 * A destination outside the app — another origin, a `mailto:`, a bare hash or
 * query — has no route to place, so it carries no type either.
 *
 * @param from - The current pathname, when there is one
 * @param href - Where the navigation goes, as `Link` and the router accept it
 * @returns One type for the route pair's motion, or none
 *
 * @category Routing
 */
export function routeTransitionTypes(
  from: string | null | undefined,
  href: RouteHref | null | undefined,
): string[] {
  const to = inAppPathname(href);
  if (!from || !to) return [];
  const motion = routeMotion(from, to);
  return motion === "none" ? [] : [routeTransitionType(motion)];
}

// One leading slash only: `//host/path` names another origin.
const IN_APP_PATH = /^\/(?!\/)/;

function inAppPathname(href: RouteHref | null | undefined): string | undefined {
  const pathname = typeof href === "string" ? href : href?.pathname;
  return pathname && IN_APP_PATH.test(pathname) ? pathname : undefined;
}

function motionBetween(origin: RoutePlace, destination: RoutePlace): RouteMotion {
  if (origin.area === "unplaced" || destination.area === "unplaced") return "fade";
  if (destination.area === "account") return origin.area === "account" ? "slide-forward" : "rise";
  if (destination.area === "onboarding") return onboardingMotion(origin, destination);
  if (origin.area !== "app") return "sink";
  return appMotion(origin, destination);
}

function onboardingMotion(origin: RoutePlace, destination: OnboardingPlace): RouteMotion {
  if (origin.area !== "onboarding") return "slide-forward";
  return slideByOrder(origin.order, destination.order);
}

function appMotion(origin: AppPlace, destination: AppPlace): RouteMotion {
  if (destination.depth > origin.depth) return "depth-in";
  if (destination.depth < origin.depth) return "depth-out";
  return slideByOrder(origin.order, destination.order);
}

function slideByOrder(originOrder: number, destinationOrder: number): RouteMotion {
  return destinationOrder < originOrder ? "slide-back" : "slide-forward";
}

function routeOf(path: string): string {
  const [pathname] = path.split(/[?#]/);
  const segments = pathname.split("/").filter(Boolean);
  const routeSegments = isLocale(segments[0]) ? segments.slice(1) : segments;
  return `/${routeSegments.join("/")}`;
}

function isLocale(segment: string | undefined): boolean {
  return routing.locales.some((locale) => locale === segment);
}

function placeOf(route: string): RoutePlace {
  if (SECTIONS.includes(route)) return { area: "app", depth: 0, order: SECTIONS.indexOf(route) };
  if (ACCOUNT_PAGES.includes(route)) return { area: "account" };
  if (ONBOARDING_STEPS.includes(route)) {
    return { area: "onboarding", order: ONBOARDING_STEPS.indexOf(route) };
  }
  return courseTreePlace(route.split("/").slice(1));
}

function courseTreePlace(segments: string[]): RoutePlace {
  const [root, , page, , lessons] = segments;
  if (root !== "courses") return UNPLACED;
  if (segments.length === 3 && COURSE_PAGES.includes(page)) {
    return { area: "app", depth: 1, order: COURSE_PAGES.indexOf(page) };
  }
  if (segments.length === 4 && page === "modules") return { area: "app", depth: 2, order: 0 };
  if (segments.length === 6 && page === "modules" && lessons === "lessons") {
    return { area: "app", depth: 3, order: 0 };
  }
  return UNPLACED;
}
