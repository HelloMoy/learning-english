import "server-only";

import { redirect } from "@/i18n/navigation";
import { getAuth } from "@/lib/auth/auth";

import { headers } from "next/headers";

/**
 * The signed-in learner's session, as Better Auth returns it.
 *
 * @category Auth
 */
export type LearnerSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>
>;

/**
 * The server-side session check every personal route runs before rendering.
 *
 * @remarks
 * The proxy only looks for a session cookie; this validates it. A cookie that
 * does not resolve to a live session — forged, expired, revoked by a password
 * reset — redirects to sign-in. Layouts call it, and a layout does not know
 * the requested path, so this redirect carries no `next`; the proxy's
 * redirect, which covers the common case of no cookie at all, does.
 *
 * @param locale - The route's locale, for the sign-in redirect
 * @returns The validated session
 *
 * @category Auth
 */
export async function requireLearnerSession(locale: string): Promise<LearnerSession> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return redirect({ href: "/sign-in", locale });
  return session;
}
