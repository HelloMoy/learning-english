import "server-only";

import type { LearnerAccountIdentity, SignInMethod } from "@/lib/account-identity/account-identity";
import { getAuth } from "@/lib/auth/auth";

import { headers } from "next/headers";

const METHOD_BY_PROVIDER: Readonly<Record<string, SignInMethod>> = {
  credential: "password",
  google: "google",
};

const METHOD_ORDER: ReadonlyArray<SignInMethod> = ["password", "google"];

/**
 * The signed-in learner's account identity for this request, or `null`
 * without a session.
 *
 * @remarks
 * The onboarding reads the name to seed the learner card, and the Profile
 * page reads all three to name the address, say how the learner signs in, and
 * decide whether the password and email forms apply. A page that must refuse
 * a visitor calls `requireLearnerSession` instead; this one only reports.
 *
 * @returns The account's name, address and sign-in methods, or `null`
 *
 * @category Auth
 */
export async function currentAccount(): Promise<LearnerAccountIdentity | null> {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const accounts = await getAuth().api.listUserAccounts({ headers: requestHeaders });
  return {
    name: session.user.name ?? "",
    email: session.user.email,
    signInMethods: signInMethodsOf(accounts),
  };
}

function signInMethodsOf(accounts: ReadonlyArray<{ providerId: string }>): SignInMethod[] {
  const linked = new Set(accounts.map((account) => METHOD_BY_PROVIDER[account.providerId]));
  return METHOD_ORDER.filter((method) => linked.has(method));
}
