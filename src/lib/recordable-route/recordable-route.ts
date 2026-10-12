import { routing } from "@/i18n/routing";

import { hasLocale } from "next-intl";

/**
 * The pages where a credential is typed or carried.
 *
 * @remarks
 * `reset-password` is the reason this exists at all: its link carries a
 * single-use token in the address, and a recording stores the address of
 * every page it shows, inside data no event filter reaches. The other three
 * are where a password is typed. Inputs are masked in recordings anyway; not
 * recording these pages at all is the stronger promise, and the one the
 * privacy policy makes.
 */
const CREDENTIAL_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

/**
 * Whether a session recording may include a page.
 *
 * @example
 * ```ts
 * isRecordableRoute("/es/reset-password"); // false
 * isRecordableRoute("/courses/basic-course"); // true
 * ```
 *
 * @param pathname - The page's path, with or without its locale prefix
 * @returns `false` for the credential pages, `true` for every other page
 *
 * @category Observability
 */
export function isRecordableRoute(pathname: string): boolean {
  const route = withoutLocale(pathname);
  return !CREDENTIAL_ROUTES.some((credential) => isAtOrUnder(route, credential));
}

function withoutLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  return hasLocale(routing.locales, first) ? `/${rest.join("/")}` : pathname;
}

function isAtOrUnder(route: string, parent: string): boolean {
  return route === parent || route.startsWith(`${parent}/`);
}
