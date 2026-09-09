import { siteUrl } from "@/lib/site-url/site-url";

import type { MetadataRoute } from "next";

/**
 * The crawling policy, decided by the deployment rather than by configuration.
 *
 * @remarks
 * Only production invites crawlers. Every Vercel preview is a byte-for-byte
 * duplicate of production under a different hostname, so an indexed preview
 * competes with the site it exists to check — and nothing in the running app
 * shows that happening, which is why this is derived rather than left to a flag
 * someone sets per deployment.
 *
 * An unknown environment — `VERCEL_ENV` unset, as it is locally — disallows.
 * Failing closed is the right default for a policy whose failure mode only
 * surfaces weeks later in someone else's index.
 *
 * @returns The robots policy Next serves at `/robots.txt`
 * @category Metadata
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
