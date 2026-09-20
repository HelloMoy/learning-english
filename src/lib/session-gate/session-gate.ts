import { routing } from "@/i18n/routing";
import { isPersonalPath } from "@/lib/personal-routes/personal-routes";
import { signInPath } from "@/lib/sign-in-return-path/sign-in-return-path";

import { getSessionCookie } from "better-auth/cookies";
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";

// Next's metadata image routes (`opengraph-image`) render catalog titles for
// link previews: crawlers fetch them without a session, and they hold nothing
// about any learner.
const SHARING_IMAGE_SEGMENT = "/opengraph-image";

/**
 * The proxy's session check: sends a request for a personal route that
 * carries no session cookie to sign-in, with the route as `next`.
 *
 * @remarks
 * Optimistic by design — it only looks for the cookie, it does not validate
 * it. Every personal page verifies the session again on the server
 * (`requireLearnerSession`), which is the check that actually protects data.
 * A path without a locale prefix is left alone: next-intl redirects it to a
 * localized path first, and that request comes back through here.
 *
 * @param request - The incoming request
 * @returns A redirect to sign-in, or `undefined` to let the request through
 *
 * @category Auth
 */
export function sessionGate(request: NextRequest): NextResponse | undefined {
  const { pathname, search } = request.nextUrl;
  const [, locale, ...rest] = pathname.split("/");
  if (!hasLocale(routing.locales, locale)) return undefined;

  const path = `/${rest.join("/")}`;
  if (!isPersonalPath(path) || isSharingImage(path) || getSessionCookie(request)) return undefined;

  return NextResponse.redirect(new URL(`/${locale}${signInPath(`${path}${search}`)}`, request.url));
}

function isSharingImage(path: string): boolean {
  return path.endsWith(SHARING_IMAGE_SEGMENT);
}
