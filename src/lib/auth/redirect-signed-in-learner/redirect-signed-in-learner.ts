import "server-only";

import { redirect } from "@/i18n/navigation";
import { getAuth } from "@/lib/auth/auth";

import { headers } from "next/headers";

/**
 * Sends a learner who is already signed in away from an account page — there
 * is nothing to sign in to.
 *
 * @param locale - The page's locale
 * @param destination - Where to send them, locale-less and already validated
 *
 * @category Auth
 */
export async function redirectSignedInLearner(locale: string, destination: string): Promise<void> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) redirect({ href: destination, locale });
}
