import { routing } from "@/i18n/routing";

import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

/** A locale the application serves. */
type Locale = (typeof routing.locales)[number];

/**
 * Narrows a route's `locale` param to a locale the application serves, or
 * ends the request as a 404.
 *
 * @remarks
 * The `[locale]` segment accepts one path segment of **anything**, and the
 * proxy that would normally validate it does not see every request: its
 * matcher excludes any path containing a dot, which is what keeps
 * `favicon.ico` from being redirected to `/en/favicon.ico`. A path such as
 * `/manifest.json` therefore reaches the router unvalidated and matches
 * `src/app/[locale]/page.tsx` with `locale = "manifest.json"`.
 *
 * `generateMetadata` runs **before** the layout's own `hasLocale` guard, so
 * without this the first thing to see that segment is `shareMetadata`, which
 * throws — logging an error on every such request for a response that was
 * always going to be a 404 anyway.
 *
 * `shareMetadata` keeps throwing on purpose, and this guard is why that is
 * safe: for a real route an unsupported locale is a programming error, and a
 * silent fallback there would publish a wrong canonical URL to crawlers
 * rather than fail loudly. The fix is to never reach it with a bad locale.
 *
 * Call it as the **first statement** of every `generateMetadata` under
 * `[locale]`. The layout's separate `hasLocale` check in its body stays: it
 * guards direct SSG builds, which never call `generateMetadata`.
 *
 * @param locale - The `locale` route param, unvalidated
 * @returns The same value, narrowed to a supported locale
 * @throws The `notFound()` control-flow signal when the locale is not one the
 *         routing configuration declares; Next resolves it to the nearest
 *         not-found boundary
 *
 * @example
 * ```ts
 * export async function generateMetadata({ params }: Props): Promise<Metadata> {
 *   const { locale } = await params;
 *   requireSupportedLocale(locale);
 *   // ...
 * }
 * ```
 *
 * @category Metadata
 */
export function requireSupportedLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return locale;
}
