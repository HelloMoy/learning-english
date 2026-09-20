import { isPersonalPath } from "@/lib/personal-routes/personal-routes";
import { isSafeInternalPath } from "@/lib/safe-internal-path/safe-internal-path";

const SIGN_IN_PATH = "/sign-in";
const DEFAULT_RETURN = "/learning";

/**
 * Whether a value may be used as the route a learner returns to after
 * signing in.
 *
 * @remarks
 * The account pages carry the interrupted route in a `next` query parameter,
 * which anyone can edit. Only safe, locale-less personal paths are accepted,
 * with or without a query string, so a crafted value can never redirect off
 * the site or onto a public page.
 *
 * @param value - The candidate `next`, without the locale prefix
 * @returns `true` when the value is a safe personal path
 *
 * @category Auth
 */
export function isSignInReturnPath(value: string): boolean {
  const [path] = value.split("?");
  return isSafeInternalPath(path) && isPersonalPath(path);
}

/**
 * Where to send a learner once they are signed in.
 *
 * @param next - The `next` query parameter, if any
 * @returns `next` when it is a valid return path, otherwise `/learning`
 *
 * @category Auth
 */
export function resolveSignInReturn(next: string | null | undefined): string {
  return next && isSignInReturnPath(next) ? next : DEFAULT_RETURN;
}

/**
 * The locale-less sign-in path, carrying `next` when it is valid.
 *
 * @param next - The route to return to after signing in
 * @returns `/sign-in` or `/sign-in?next=<encoded next>`
 *
 * @category Auth
 */
export function signInPath(next?: string): string {
  if (next === undefined || !isSignInReturnPath(next)) return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}`;
}
