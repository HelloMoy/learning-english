import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next.js 16 uses `proxy.ts` for middleware (formerly `middleware.ts`).
 * The matcher below excludes API routes, Next internals, Vercel internals,
 * and static files (anything containing a dot, e.g. `favicon.ico`).
 */
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
