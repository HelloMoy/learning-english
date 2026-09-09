import { z } from "zod";

/**
 * The absolute origin the application publishes about itself.
 *
 * @remarks
 * Every absolute URL the site emits — `metadataBase`, the canonical link, the
 * `hreflang` alternates, `og:url` — is built on this. It is resolved rather
 * than configured because the correct answer differs per environment: a
 * production deployment, a Vercel preview whose hostname changes on every push,
 * and a local dev server on whatever port it managed to bind are three
 * different origins, and only the first is known ahead of time.
 *
 * Resolution order, first match wins:
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — an explicit override, and the production answer
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — the project's stable production domain
 * 3. `VERCEL_URL` — this specific deployment, so a preview describes itself
 *    rather than advertising production
 * 4. `http://localhost:${PORT ?? 3000}`
 *
 * A value that is set but not an absolute `http(s)` URL throws instead of
 * falling through to the next candidate. Falling through would turn a typo into
 * a production site quietly advertising a preview origin — and the symptom of a
 * missing origin is invisible in the running app: Next emits relative
 * `og:image` and `og:url` values, nothing errors, and crawlers drop them.
 *
 * Read at call time, not at module load, so a value set after import is seen.
 *
 * @example
 * ```ts
 * export const metadata: Metadata = { metadataBase: new URL(siteUrl()) };
 * ```
 *
 * @returns The origin, without a trailing slash, so a pathname can be appended
 * @throws If an environment variable declares an origin that is not an absolute `http(s)` URL
 * @category Metadata
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return parseOrigin(explicit, "NEXT_PUBLIC_SITE_URL");

  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionDomain) {
    return parseOrigin(`https://${productionDomain}`, "VERCEL_PROJECT_PRODUCTION_URL");
  }

  const deploymentDomain = process.env.VERCEL_URL;
  if (deploymentDomain) return parseOrigin(`https://${deploymentDomain}`, "VERCEL_URL");

  return `http://localhost:${process.env.PORT ?? "3000"}`;
}

const AbsoluteHttpUrl = z.url({ protocol: /^https?$/ });

/**
 * Validates one candidate and normalizes away its trailing slash.
 *
 * The variable name travels into the error message because the caller is
 * whoever set the environment, not whoever wrote the code — "invalid url" alone
 * does not tell them which of four variables to fix.
 */
function parseOrigin(candidate: string, variableName: string): string {
  const parsed = AbsoluteHttpUrl.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(
      `${variableName} must be an absolute http(s) URL, received "${candidate}". ` +
        "Unset it to fall back to the deployment's own origin.",
    );
  }
  return parsed.data.replace(/\/$/, "");
}
