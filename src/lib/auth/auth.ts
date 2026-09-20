import "server-only";

import type { EmailSender } from "@/adapters/email/email-sender";
import { SmtpEmailSender } from "@/adapters/email/smtp-email-sender/smtp-email-sender";
import { getDatabase, type Database } from "@/adapters/persistence/turso/database/database";
import * as schema from "@/adapters/persistence/turso/schema/schema";
import { composeAccountEmail, type AccountEmailKind } from "@/lib/account-emails/account-emails";
import { isAuthRateLimited, serverEnv } from "@/lib/server-env/server-env";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { captcha } from "better-auth/plugins";

const PASSWORD_LENGTH = { min: 8, max: 128 } as const;

/**
 * Everything the auth configuration depends on, injected so a test can hand
 * it a container database, a real SMTP inbox and a local captcha verifier.
 *
 * @category Auth
 */
export type AuthDependencies = {
  database: Database;
  emailSender: EmailSender;
  secret: string;
  baseURL: string;
  google: { clientId: string; clientSecret: string };
  captcha: { secretKey: string; siteVerifyUrl?: string };
  /** Rate limiting is for production: parallel e2e sign-ins share one IP (see `isAuthRateLimited`). */
  rateLimited: boolean;
};

/**
 * Builds the Better Auth instance the application runs on.
 *
 * @remarks
 * Email and password (verified before first sign-in, 8–128 characters,
 * other sessions revoked on reset), Google with account linking by verified
 * address, account deletion confirmed by an emailed link that only works in
 * the account's own session, Turnstile on the three form endpoints, rate limits stored in the
 * database, and `nextCookies` last so Server Actions set cookies.
 *
 * @param dependencies - The database, the email sender and the secrets
 * @returns The configured auth instance
 */
export function createAuth(dependencies: AuthDependencies) {
  const sendAccountEmail = accountEmailSender(dependencies.emailSender);

  return betterAuth({
    secret: dependencies.secret,
    baseURL: dependencies.baseURL,
    database: drizzleAdapter(dependencies.database, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: PASSWORD_LENGTH.min,
      maxPasswordLength: PASSWORD_LENGTH.max,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) => sendAccountEmail("reset-password", user.email, url),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) => sendAccountEmail("verify-email", user.email, url),
    },
    user: {
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: ({ user, url }) =>
          sendAccountEmail("delete-account", user.email, url),
      },
    },
    socialProviders: { google: dependencies.google },
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    rateLimit: { enabled: dependencies.rateLimited, storage: "database" },
    plugins: [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: dependencies.captcha.secretKey,
        siteVerifyURLOverride: dependencies.captcha.siteVerifyUrl,
      }),
      nextCookies(),
    ],
  });
}

/**
 * The configured auth instance type.
 *
 * @category Auth
 */
export type Auth = ReturnType<typeof createAuth>;

let processAuth: Auth | undefined;

/**
 * The auth instance this server process uses, built on first call from the
 * validated environment.
 *
 * @remarks
 * Lazy for the same reason as `serverEnv()`: `next build` evaluates this
 * module without production secrets.
 *
 * @returns The process-wide auth instance
 */
export function getAuth(): Auth {
  processAuth ??= createAuth(dependenciesFromEnv());
  return processAuth;
}

function dependenciesFromEnv(): AuthDependencies {
  const env = serverEnv();
  return {
    database: getDatabase(),
    emailSender: new SmtpEmailSender({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      from: env.EMAIL_FROM,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    captcha: { secretKey: env.TURNSTILE_SECRET_KEY },
    rateLimited: isAuthRateLimited(env),
  };
}

function accountEmailSender(emailSender: EmailSender) {
  return async (kind: AccountEmailKind, to: string, actionUrl: string): Promise<void> => {
    const email = await composeAccountEmail(kind, actionUrl);
    const sent = await emailSender.send({ to, ...email });
    if (sent.isErr()) {
      console.error(`Could not send the ${kind} email`, sent.error.cause);
      throw new Error(`The ${kind} email could not be sent`);
    }
  };
}
