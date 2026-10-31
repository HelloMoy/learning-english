import { ANALYTICS_RELAY_PATH } from "@/lib/product-analytics-options/product-analytics-options";

import { NextResponse, type NextRequest } from "next/server";

// Constants, not environment variables: the privacy policy says usage data is
// stored in the United States, and a variable could contradict that sentence
// with no test able to notice.
const INGESTION_HOST = "us.i.posthog.com";
const ASSET_HOST = "us-assets.i.posthog.com";

/** PostHog serves its scripts from a separate host so their cache headers survive. */
const SCRIPT_PREFIXES = ["/static/", "/array/"];

/**
 * The only request headers PostHog receives.
 *
 * @remarks
 * A list of what to keep, not of what to drop. Everything else the browser or
 * the platform attaches stays here: the session cookie; `Authorization`; the
 * `Referer`, which for a same-origin request is the full page address —
 * including the token of a password-reset link; and the hosting platform's
 * own `x-vercel-*` headers.
 *
 * `x-forwarded-for` and `user-agent` are what PostHog hashes to count a
 * visitor who declined storage.
 */
const FORWARDED_HEADERS = [
  "accept",
  "accept-encoding",
  "accept-language",
  "content-encoding",
  "content-length",
  "content-type",
  "origin",
  "transfer-encoding",
  "user-agent",
  "x-forwarded-for",
  "x-real-ip",
];

/**
 * The proxy's relay to PostHog: forwards a request under
 * {@link ANALYTICS_RELAY_PATH} to PostHog's US cloud.
 *
 * @remarks
 * Analytics requests are sent to the application's own origin so that a
 * content blocker which stops PostHog's hosts does not stop the count. The
 * price is that the browser treats them as same-origin and attaches the
 * session cookie — so this is the one place where a mistake hands a learner's
 * session to a third party.
 *
 * The headers are replaced through `request.headers`, which is what Next
 * sends upstream. PostHog's own example passes them as `headers`, which in
 * Next sets the *response* headers and leaves the upstream request, cookie
 * included, untouched.
 *
 * Must run before `sessionGate` and locale handling: an analytics request is
 * not a page, and must be neither redirected to sign-in nor given a locale.
 *
 * @param request - The incoming request
 * @returns A rewrite to PostHog, or `undefined` when the request is not for the relay
 *
 * @category Observability
 */
export function analyticsRelay(request: NextRequest): NextResponse | undefined {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith(`${ANALYTICS_RELAY_PATH}/`)) return undefined;

  const upstreamPath = pathname.slice(ANALYTICS_RELAY_PATH.length);
  const host = upstreamHostFor(upstreamPath);
  return NextResponse.rewrite(new URL(`https://${host}${upstreamPath}${search}`), {
    request: { headers: headersFor(host, request.headers) },
  });
}

function upstreamHostFor(path: string): string {
  return SCRIPT_PREFIXES.some((prefix) => path.startsWith(prefix)) ? ASSET_HOST : INGESTION_HOST;
}

function headersFor(host: string, incoming: Headers): Headers {
  // PostHog routes by `host`; without it the request is answered 401.
  const forwarded = new Headers({ host });
  for (const name of FORWARDED_HEADERS) {
    const value = incoming.get(name);
    if (value !== null) forwarded.set(name, value);
  }
  return forwarded;
}
