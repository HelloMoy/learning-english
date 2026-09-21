import "server-only";

import type { EmailSender } from "@/adapters/email/email-sender";
import { SmtpEmailSender } from "@/adapters/email/smtp-email-sender/smtp-email-sender";
import { getDatabase, type Database } from "@/adapters/persistence/turso/database/database";
import * as schema from "@/adapters/persistence/turso/schema/schema";
import { routing } from "@/i18n/routing";
import {
  composeAccountEmail,
  type AccountEmailKind,
  type AccountEmailValues,
} from "@/lib/account-emails/account-emails";
import { isAuthRateLimited, serverEnv } from "@/lib/server-env/server-env";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { captcha } from "better-auth/plugins";
import { hasLocale } from "next-intl";

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
 * A password that actually changes notifies the account either way it
 * changed: `onPasswordReset` covers the emailed reset link, and an `after`
 * hook covers the Profile form, which Better Auth offers no callback for. A
 * refused attempt notifies nobody — after hooks run for those too, so the
 * outcome is read rather than assumed.
 *
 * An email change takes two links, because `sendChangeEmailConfirmation` is
 * set and the learner's address is verified: an approval goes to the address
 * on file first, and only when it is opened does a verification go to the new
 * one. The address moves when that second link is opened, so neither a
 * hijacked session nor a mistyped address can move an account on its own.
 *
 * @param dependencies - The database, the email sender and the secrets
 * @returns The configured auth instance
 */
export function createAuth(dependencies: AuthDependencies) {
  const sendAccountEmail = accountEmailSender(dependencies.emailSender);

  /**
   * Tells an address that its password was replaced, without waiting for the
   * mail server and without ever failing the change that caused it.
   *
   * The link is the forgot-password page and carries no token: the one reader
   * this notice exists for is the one who should not be handed a key.
   */
  const notifyPasswordChanged = (to: string, locale: string): void => {
    const recovery = `${dependencies.baseURL}/${locale}/forgot-password`;
    void sendAccountEmail("password-changed", to, recovery).catch((cause: unknown) => {
      console.error("Could not send the password-changed notice", cause);
    });
  };

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
      onPasswordReset: ({ user }, request) =>
        Promise.resolve(notifyPasswordChanged(user.email, localeOfRequest(request?.headers))),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) => sendAccountEmail("verify-email", user.email, url),
    },
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: ({ user, newEmail, url }) =>
          sendAccountEmail("change-email", user.email, url, { newEmail }),
      },
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: ({ user, url }) =>
          sendAccountEmail("delete-account", user.email, url),
      },
    },
    socialProviders: { google: dependencies.google },
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    rateLimit: { enabled: dependencies.rateLimited, storage: "database" },
    hooks: {
      // Better Auth has no email callback for `/change-password`, and it runs
      // its after hooks for a refused request too — so the outcome is checked
      // here rather than assumed, or a stolen session could bury the real
      // notice under one per wrong guess.
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/change-password") return;
        const changed = ctx.context.returned;
        if (isAPIError(changed)) return;
        const { user } = changed as { user: { email: string } };
        notifyPasswordChanged(user.email, localeOfRequest(ctx.headers));
      }),
    },
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

/** The header every account form sets, naming the locale the learner is in. */
const LOCALE_HEADER = "x-app-locale";

/**
 * The locale a request was made in, as its own form stated.
 *
 * @remarks
 * The endpoints that notify on success run no locale of their own:
 * `/change-password` takes no `callbackURL` and `/reset-password` carries only
 * a token. The browser is the only party that knows, so it says so, and a
 * value that is not one of the three shipped catalogues falls back rather
 * than producing an untranslated message.
 */
function localeOfRequest(headers: Headers | undefined): string {
  const stated = headers?.get(LOCALE_HEADER);
  return hasLocale(routing.locales, stated) ? stated : routing.defaultLocale;
}

function accountEmailSender(emailSender: EmailSender) {
  return async (
    kind: AccountEmailKind,
    to: string,
    actionUrl: string,
    values?: AccountEmailValues,
  ): Promise<void> => {
    const email = await composeAccountEmail(kind, actionUrl, values);
    const sent = await emailSender.send({ to, ...email });
    if (sent.isErr()) {
      console.error(`Could not send the ${kind} email`, sent.error.cause);
      throw new Error(`The ${kind} email could not be sent`);
    }
  };
}
