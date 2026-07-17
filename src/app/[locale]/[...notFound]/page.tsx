import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths inside the `[locale]` segment. Triggers
 * the locale-segment `not-found.tsx` (localized "Locale not supported"
 * message + home link).
 *
 * Example: a request to `/xx` is redirected by the next-intl middleware
 * to `/en/xx`. That path matches no specific route (no
 * `/[locale]/xx/page.tsx`), so this catch-all fires `notFound()`, which
 * Next.js catches and renders `[locale]/not-found.tsx` — the localized
 * page the spec requires.
 *
 * Routes that DO exist (e.g. `/[locale]/courses/.../lessons/[lessonId]`)
 * match first because named segments outrank `[...catchAll]`.
 */
export default function CatchAllNotFound() {
  notFound();
}
