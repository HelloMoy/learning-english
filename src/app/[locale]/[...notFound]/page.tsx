import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths inside the `[locale]` segment. Fires
 * `notFound()`, which renders the locale-segment `not-found.tsx` — the
 * localized "Page not found" message and a home link.
 *
 * Example: a request to `/xx` is redirected by the proxy to `/en/xx`. That
 * path matches no specific route (no `/[locale]/xx/page.tsx`), so this
 * catch-all fires. Note what that redirect means: an unrecognized first
 * segment arrives here as a *missing page* under a supported locale, never as
 * an unsupported locale — see `not-found.tsx` for why that retired the page's
 * earlier copy.
 *
 * It calls `notFound()` rather than rendering the message itself, because
 * that is what produces the 404 status; a page that renders normally would
 * answer a missing page with a 200.
 *
 * Routes that DO exist (e.g. `/[locale]/courses/.../lessons/[lessonId]`)
 * match first because named segments outrank `[...catchAll]`.
 */
export default function CatchAllNotFound() {
  notFound();
}
