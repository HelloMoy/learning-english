"use client";

import { usePathname, useRouter } from "@/i18n/intl-navigation";
import { routeTransitionTypes } from "@/lib/route-motion/route-motion";

import { useMemo } from "react";

type IntlRouter = ReturnType<typeof useRouter>;
type Navigate = IntlRouter["push"];

/**
 * next-intl's router, with `push` and `replace` tagging each navigation with
 * the route transition for where it starts and where it lands.
 *
 * @remarks
 * Exported from `@/i18n/navigation` as `useRouter`, so call sites get the
 * motion without asking for it. Everything the caller passes still reaches
 * next-intl: `locale` switches locale as before, and an explicit
 * `transitionTypes` replaces the computed one for a call site that knows
 * better.
 *
 * The returned router keeps its identity while the route stays the same.
 * Effects list it as a dependency, and a new object per render would re-run
 * every one of them.
 *
 * @example
 * ```tsx
 * const router = useRouter(); // from "@/i18n/navigation"
 * router.push("/start/avatar"); // slides forward from /start
 * ```
 *
 * @returns The locale-aware router
 *
 * @category Routing
 */
export function useRouteRouter(): IntlRouter {
  const router = useRouter();
  const pathname = usePathname();

  return useMemo(
    () => ({
      ...router,
      push: withRouteTransition(router.push, pathname),
      replace: withRouteTransition(router.replace, pathname),
    }),
    [router, pathname],
  );
}

function withRouteTransition(navigate: Navigate, pathname: string | null): Navigate {
  return (href, options) => {
    const transitionTypes = routeTransitionTypes(pathname, href);
    const routeOptions = transitionTypes.length > 0 ? { transitionTypes } : {};
    navigate(href, { ...routeOptions, ...options });
  };
}
