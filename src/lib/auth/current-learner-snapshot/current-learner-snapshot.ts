import "server-only";

import { getDatabase } from "@/adapters/persistence/turso/database/database";
import { loadLearnerSnapshot } from "@/adapters/persistence/turso/learner-snapshot/learner-snapshot";
import { getAuth } from "@/lib/auth/auth";
import type { LearnerSnapshot } from "@/lib/learner-snapshot/learner-snapshot";

import { headers } from "next/headers";

/**
 * The signed-in learner's snapshot for this request, or `null` without a
 * session.
 *
 * @remarks
 * The locale layout's one read of the session: it both tells the header
 * whether to offer Sign in and seeds the browser's learner store. A page
 * that must refuse a visitor calls `requireLearnerSession` instead.
 *
 * @returns The snapshot, or `null` for a visitor without a live session
 *
 * @category Auth
 */
export async function currentLearnerSnapshot(): Promise<LearnerSnapshot | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  return loadLearnerSnapshot(getDatabase(), session.user.id);
}
