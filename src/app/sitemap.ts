import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url/site-url";

import type { MetadataRoute } from "next";

const HOME_PATH = "/";

/**
 * Every path an anonymous visitor can read, and therefore everything a crawler
 * may be told about.
 *
 * @remarks
 * A literal tuple rather than something derived from the route tree: deriving
 * it would also pick up the personal routes, and the specific mistake this file
 * invites is advertising a URL that answers a crawler with the sign-in page.
 * Publishing a new public page means adding a line here — and a test counts the
 * entries, so forgetting fails rather than passing in silence.
 */
const PUBLIC_PATHS = [HOME_PATH, "/privacy", "/terms"] as const;

/**
 * The URLs a crawler can be served, in every locale, with their alternates.
 *
 * @remarks
 * The home and the two legal documents. Every course, module and lesson route
 * requires a session and answers an anonymous crawler with the sign-in page;
 * listing them would advertise URLs that never render the content they name.
 *
 * Each entry restates its locale alternates, so a crawler learns the three
 * renderings are one page from the sitemap alone.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();

  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absolute(origin, locale, path),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alternate) => [alternate, absolute(origin, alternate, path)]),
        ),
      },
    })),
  );
}

function absolute(origin: string, locale: string, path: string): string {
  return `${origin}/${locale}${path === HOME_PATH ? "" : path}`;
}
