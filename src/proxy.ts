import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { sessionGate } from "./lib/session-gate/session-gate";

const localize = createMiddleware(routing);

/**
 * Next.js 16 uses `proxy.ts` for middleware (formerly `middleware.ts`).
 *
 * The session gate runs first: a personal route without a session cookie is
 * redirected to sign-in before next-intl sees it. Everything else is handled
 * by next-intl unchanged.
 */
export default function proxy(request: NextRequest) {
  return sessionGate(request) ?? localize(request);
}

/**
 * The matcher excludes API routes, Next internals, Vercel internals, and
 * static files (anything containing a dot, e.g. `favicon.ico`).
 */
export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
