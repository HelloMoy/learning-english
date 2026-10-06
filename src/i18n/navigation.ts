/**
 * Locale-aware wrappers around Next.js navigation APIs. Always import these
 * (`Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`) instead of
 * the bare `next/link` and `next/navigation` exports — they automatically
 * preserve the active locale in the URL.
 *
 * `Link` and `useRouter` also tag each navigation with its route transition,
 * chosen from the route it starts on and the route it lands on. See
 * `openspec/specs/route-transitions/spec.md`.
 */
export { RouteLink as Link } from "@/components/route-link/route-link";
export { useRouteRouter as useRouter } from "@/hooks/use-route-router/use-route-router";

export { redirect, usePathname, getPathname } from "./intl-navigation";
