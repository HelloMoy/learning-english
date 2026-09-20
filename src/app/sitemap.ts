import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url/site-url";

import type { MetadataRoute } from "next";

const HOME_PATH = "/";

/**
 * The URLs a crawler can be served, in every locale, with their alternates.
 *
 * @remarks
 * Only the home. Every course, module and lesson route requires a session and
 * answers an anonymous crawler with the sign-in page; listing them would
 * advertise URLs that never render the content they name.
 *
 * Each entry restates its locale alternates, so a crawler learns the three
 * homes are one page from the sitemap alone.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();

  return routing.locales.map((locale) => ({
    url: absolute(origin, locale, HOME_PATH),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((alternate) => [alternate, absolute(origin, alternate, HOME_PATH)]),
      ),
    },
  }));
}

function absolute(origin: string, locale: string, path: string): string {
  return `${origin}/${locale}${path === HOME_PATH ? "" : path}`;
}
