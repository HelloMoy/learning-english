"use client";

import { Link, usePathname } from "@/i18n/intl-navigation";
import { routeTransitionTypes } from "@/lib/route-motion/route-motion";

import type { ComponentProps } from "react";

/**
 * Props of {@link RouteLink}: exactly next-intl's `Link` props.
 *
 * @remarks
 * `transitionTypes` is the one worth knowing about. Leave it out and the link
 * carries the motion for its route pair; pass it and the link carries exactly
 * what you pass, for a call site that knows something the route pair does not
 * — a "previous lesson" link, which should slide back.
 *
 * @category Routing
 */
export type RouteLinkProps = ComponentProps<typeof Link>;

/**
 * The app's `Link`: next-intl's locale-aware link, plus the route transition
 * for the page it is rendered on and the page it points at.
 *
 * @remarks
 * Exported from `@/i18n/navigation` as `Link` — import it from there, never
 * from this file. It is a client component because the motion depends on the
 * current pathname, which only the client knows during a navigation; Server
 * Components can still render it, since every prop a link takes is
 * serialisable.
 *
 * A link with no motion — to the current route, to another origin, or
 * rendered where there is no pathname — navigates exactly as next-intl's
 * `Link` does.
 *
 * @example
 * ```tsx
 * import { Link } from "@/i18n/navigation";
 *
 * <Link href="/courses">Courses</Link>
 * <Link href={previousLesson} transitionTypes={["route-slide-back"]}>Previous</Link>
 * ```
 *
 * @param props - See {@link RouteLinkProps}
 *
 * @category Routing
 */
export function RouteLink({ transitionTypes, ...linkProps }: RouteLinkProps) {
  const pathname = usePathname();
  const routeTypes = transitionTypes ?? routeTransitionTypes(pathname, linkProps.href);

  return (
    <Link
      {...linkProps}
      transitionTypes={routeTypes.length > 0 ? routeTypes : undefined}
    />
  );
}
