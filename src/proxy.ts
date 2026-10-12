import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { analyticsRelay } from "./lib/analytics-relay/analytics-relay";
import { missingPage } from "./lib/missing-page/missing-page";
import { sessionGate } from "./lib/session-gate/session-gate";

const localize = createMiddleware(routing);

/**
 * Next.js 16 uses `proxy.ts` for middleware (formerly `middleware.ts`).
 *
 * The analytics relay runs first: its requests are not pages, and must be
 * neither redirected to sign-in nor given a locale. Then the session gate: a
 * personal route without a session cookie is redirected to sign-in before
 * next-intl sees it. Everything else is handled by next-intl unchanged.
 */
export default function proxy(request: NextRequest) {
  return (
    analyticsRelay(request) ?? sessionGate(request) ?? missingPage(request) ?? localize(request)
  );
}

/**
 * The first matcher excludes API routes, Next internals, Vercel internals, and
 * static files (anything containing a dot, e.g. `favicon.ico`).
 *
 * The second is the analytics relay, which needs its own entry because
 * PostHog's script files contain a dot. Next reads this object statically, so
 * the path is spelled out rather than built from `ANALYTICS_RELAY_PATH`;
 * `proxy.test.ts` fails if the two ever disagree.
 */
export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)", "/pulse/:path*"],
};
