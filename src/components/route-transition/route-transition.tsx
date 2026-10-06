/// <reference types="react/canary" />
import { ROUTE_MOTIONS, routeTransitionType } from "@/lib/route-motion/route-motion";

import * as React from "react";

/**
 * Which view-transition class each kind of navigation plays on the page.
 *
 * @remarks
 * Keys are transition types, values are the classes `globals.css` selects with
 * `::view-transition-old/new(.route-<motion>)`. They are the same string on
 * purpose. `default: "none"` is what keeps everything untyped instant: browser
 * back, server redirects, `router.refresh()`, and content replacing a loading
 * skeleton.
 *
 * @category Routing
 */
export const ROUTE_TRANSITION_CLASSES: React.ViewTransitionClassPerType = {
  ...Object.fromEntries(ROUTE_MOTIONS.map((motion) => typeToItsOwnClass(motion))),
  default: "none",
};

function typeToItsOwnClass(motion: (typeof ROUTE_MOTIONS)[number]): [string, string] {
  return [routeTransitionType(motion), routeTransitionType(motion)];
}

/**
 * The one boundary every route transition animates: the page and its footer,
 * as a single moving surface.
 *
 * @remarks
 * Rendered once, in the locale layout, around everything below the site
 * header. A navigation mutates what is inside it, and React plays the class
 * for the navigation's transition type on the old and the new snapshot.
 *
 * One wrapper element, so the browser takes one snapshot: a footer captured
 * on its own would ghost between its old and new position instead of leaving
 * with its page. The wrapper is the flex column that keeps the footer at the
 * bottom of a short page, a job it takes over from `<body>`.
 *
 * `ViewTransition` comes from the React canary Next bundles for the App
 * Router. The React that Vitest and Storybook load does not have it, so the
 * page is rendered in the same wrapper without a boundary there — same DOM,
 * no motion.
 *
 * @example
 * ```tsx
 * <SiteHeader />
 * <RouteTransition>
 *   <div className="flex-1">{children}</div>
 *   <SiteFooter />
 * </RouteTransition>
 * ```
 *
 * @param props.children - The page content and footer
 *
 * @category Routing
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const Boundary: typeof React.ViewTransition | undefined = React.ViewTransition;
  const page = <div className="flex flex-1 flex-col">{children}</div>;

  if (!Boundary) return page;
  return (
    <Boundary
      update={ROUTE_TRANSITION_CLASSES}
      default="none"
    >
      {page}
    </Boundary>
  );
}
