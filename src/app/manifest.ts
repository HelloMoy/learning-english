import { routing } from "@/i18n/routing";

import type { MetadataRoute } from "next";

/**
 * The web app manifest.
 *
 * @remarks
 * What this buys is narrow and worth having: adding the site to a home screen
 * produces the brand and its mark rather than a screenshot and an untitled
 * entry, and the OS paints its chrome in the app's own colour. It deliberately
 * stops there — no service worker, because the app streams video from a content
 * store that a service worker cannot cache, so one would add an invalidation
 * layer to get wrong and nothing else.
 *
 * `start_url` carries a locale. `localePrefix` is `always`, so the bare origin
 * only redirects, and an installed app pointed at `/` would pay for that
 * redirect on every cold start. The default locale is read from the routing
 * configuration rather than written out, so it cannot drift from it.
 *
 * The colours are the Immersion Cinema dark tokens from `globals.css`: the
 * palette the app defaults to.
 *
 * @category Metadata
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Course",
    short_name: "English Course",
    description: "Pronunciation-first English courses, in order.",
    start_url: `/${routing.defaultLocale}`,
    scope: "/",
    display: "standalone",
    background_color: "#08080b",
    theme_color: "#08080b",
    lang: routing.defaultLocale,
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
