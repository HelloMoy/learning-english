import "server-only";

import { getDatabase } from "@/adapters/persistence/turso/database/database";
import { loadLearnerSnapshot } from "@/adapters/persistence/turso/learner-snapshot/learner-snapshot";
import { getAuth } from "@/lib/auth/auth";
import type { LearnerSnapshot } from "@/lib/learner-snapshot/learner-snapshot";

import { headers } from "next/headers";

/**
 * The learner a request is signed in as.
 *
 * @category Auth
 */
export type CurrentLearner = {
  /** The account's ID. The only thing about the learner that product analytics is given. */
  accountId: string;
  /** The learner's state, for seeding the browser's learner store. */
  snapshot: LearnerSnapshot;
};

/**
 * The signed-in learner for this request, or `null` without a session.
 *
 * @remarks
 * The locale layout's one read of the session: it tells the header whether to
 * offer Sign in, seeds the browser's learner store, and names the account
 * that usage data is attributed to once the learner consents. A page that
 * must refuse a visitor calls `requireLearnerSession` instead.
 *
 * @returns The learner, or `null` for a visitor without a live session
 *
 * @category Auth
 */
export async function currentLearner(): Promise<CurrentLearner | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const accountId = session.user.id;
  return { accountId, snapshot: await loadLearnerSnapshot(getDatabase(), accountId) };
}
