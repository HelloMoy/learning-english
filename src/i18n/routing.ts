import { defineRouting } from "next-intl/routing";

/**
 * Centralized routing configuration for next-intl.
 *
 * - `locales`: every locale the app supports. Add a new entry here, then
 *   create a matching `messages/<locale>.json` file.
 * - `defaultLocale`: used when the request doesn't match any locale (e.g.
 *   middleware redirects `/` → `/en`).
 * - `localePrefix: 'always'` keeps the locale in the URL (`/en/about`) so
 *   links are unambiguous and SEO-friendly.
 */
export const routing = defineRouting({
  locales: ["en", "es", "pt"],
  defaultLocale: "en",
  localePrefix: "always",
});
