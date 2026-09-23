import { routing } from "@/i18n/routing";
import { isKnownRoutePath } from "@/lib/known-route-segments/known-route-segments";

import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Answers a request for a path no route serves with a real 404.
 *
 * @remarks
 * The catch-all under `[locale]` already renders the localized "Page not
 * found" state by calling `notFound()`. What it cannot do is set the status.
 * The locale segment has a `loading.tsx`, so every page under it is wrapped in
 * a Suspense boundary; the server must commit to `200 OK` before it can start
 * streaming the shell, and by the time `notFound()` throws, the status has
 * been sent. Next.js documents this and compensates by injecting
 * `<meta name="robots" content="noindex">` — a soft 404. Removing the loading
 * skeleton restores the status and was measured to do so, but that skeleton is
 * its own requirement.
 *
 * The documented way to keep both is to decide before anything streams, which
 * is here. The rewrite points at the same URL, so the catch-all still renders
 * the same localized page; only the status changes.
 *
 * Runs after `sessionGate`, so a personal route still redirects to sign-in
 * rather than answering 404 to a signed-out learner, and before `localize`,
 * which would otherwise commit the response first. A request whose first
 * segment is not a configured locale is left alone: `localize` redirects it to
 * one, and the rewritten path comes back through here.
 *
 * Spec: lesson-view-polish § "An unknown path under a supported locale renders
 * a localized Page Not Found".
 *
 * @param request - The incoming request
 * @returns A 404 rewrite when no route serves the path, otherwise `undefined`
 *
 * @category Routing
 */
export function missingPage(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;
  const [, locale, ...rest] = pathname.split("/");
  if (!hasLocale(routing.locales, locale)) return undefined;
  if (isKnownRoutePath(`/${rest.join("/")}`)) return undefined;

  return NextResponse.rewrite(request.nextUrl, { status: 404 });
}
