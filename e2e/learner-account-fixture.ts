import { faker } from "@faker-js/faker";
import { createClient } from "@libsql/client";
import { test as base, expect, type BrowserContext } from "@playwright/test";

import { learnerStateOf, type LearnerState } from "./learner-state-fixture";

/**
 * Signed-in learners for specs that open personal routes.
 *
 * @remarks
 * Every personal route requires a session (capability: `learner-account`), so
 * each test gets an account of its own — parallel tests never share a learner.
 * The account goes through the app's real sign-up and sign-in endpoints; the
 * only shortcut is marking the address verified with one SQL statement, since
 * following a Mailpit link per test would cost seconds and prove nothing the
 * dedicated account spec does not.
 */

/** The Compose database the dev server reads, unless the environment says otherwise. */
const DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "http://127.0.0.1:8081";

/**
 * Any token passes Cloudflare's always-pass test secret, which is what the
 * local and CI environments configure.
 */
const TEST_CAPTCHA_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

/** An account a spec can sign in as. */
export type LearnerAccount = { name: string; email: string; password: string };

/**
 * A fresh, unregistered account.
 *
 * @returns Credentials no other test uses
 */
export function aLearnerAccount(): LearnerAccount {
  return {
    name: faker.person.fullName(),
    email: `e2e-${faker.string.uuid()}@example.com`,
    password: faker.internet.password({ length: 16 }),
  };
}

/**
 * Registers an account and marks its address verified, without signing in.
 *
 * @param context - Any browser context of the run (only its request API is used)
 * @param account - The credentials to register
 */
export async function registerVerifiedLearner(
  context: BrowserContext,
  account: LearnerAccount,
): Promise<void> {
  const signUp = await context.request.post("/api/auth/sign-up/email", {
    headers: authHeaders(),
    data: { ...account, callbackURL: "/en/learning" },
  });
  expect(signUp.ok(), `sign-up answered ${signUp.status()}`).toBe(true);
  await markEmailVerified(account.email);
}

/**
 * Signs a registered learner in; the session cookie lands in the context.
 *
 * @param context - The browser context the session belongs to
 * @param account - Registered, verified credentials
 */
export async function signInAs(context: BrowserContext, account: LearnerAccount): Promise<void> {
  const signIn = await attemptSignIn(context, account);
  expect(signIn.ok(), `sign-in answered ${signIn.status()}`).toBe(true);
}

/**
 * Tries to sign in with a set of credentials, whatever the outcome.
 *
 * @param context - The browser context the session would belong to
 * @param account - The credentials to try
 * @returns Better Auth's response, for the spec to judge
 */
export function attemptSignIn(context: BrowserContext, account: LearnerAccount) {
  return context.request.post("/api/auth/sign-in/email", {
    headers: authHeaders(),
    data: { email: account.email, password: account.password },
  });
}

function authHeaders(): Record<string, string> {
  return { "x-captcha-response": TEST_CAPTCHA_TOKEN };
}

async function markEmailVerified(email: string): Promise<void> {
  const database = createClient({ url: DATABASE_URL });
  try {
    await database.execute({
      sql: "update user set email_verified = 1 where email = ?",
      args: [email],
    });
  } finally {
    database.close();
  }
}

/**
 * Playwright's `test`, with every context signed in as a learner of its own,
 * and that learner's rows at hand as `learnerState`.
 */
export const test = base.extend<{ learnerAccount: LearnerAccount; learnerState: LearnerState }>({
  learnerAccount: [
    async ({ context }, use) => {
      const account = aLearnerAccount();
      await registerVerifiedLearner(context, account);
      await signInAs(context, account);
      await use(account);
    },
    { auto: true },
  ],
  learnerState: async ({ learnerAccount }, provide) => {
    await provide(learnerStateOf(learnerAccount));
  },
});

export { expect };
