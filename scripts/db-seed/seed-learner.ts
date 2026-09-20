import { randomUUID } from "node:crypto";

import type { Database } from "@/adapters/persistence/turso/database/database";
import { account, user } from "@/adapters/persistence/turso/schema/schema";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

/**
 * The learner `pnpm db:seed` creates: verified, with a password, so a fresh
 * local database can be signed into without going through Mailpit.
 */
export const SEED_LEARNER = {
  name: "Ana García",
  email: "learner@example.com",
  password: "learner-password",
} as const;

/** Better Auth's provider id for email-and-password accounts. */
const CREDENTIAL_PROVIDER = "credential";

/**
 * Creates {@link SEED_LEARNER} unless an account with that address exists.
 *
 * @remarks
 * Writes the two rows Better Auth itself writes for a verified email sign-up —
 * the user and its credential account — hashing the password with Better
 * Auth's own hasher, so signing in exercises the real path.
 *
 * @param database - The database to seed
 */
export async function seedLearner(database: Database): Promise<void> {
  const existing = await database.select().from(user).where(eq(user.email, SEED_LEARNER.email));
  if (existing.length > 0) return;

  const userId = randomUUID();
  const now = new Date();
  await database.insert(user).values({
    id: userId,
    name: SEED_LEARNER.name,
    email: SEED_LEARNER.email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
  await database.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: CREDENTIAL_PROVIDER,
    userId,
    password: await hashPassword(SEED_LEARNER.password),
    createdAt: now,
    updatedAt: now,
  });
}
