import { createAuthClient } from "better-auth/react";

/**
 * The browser's Better Auth client: sign-up, sign-in (email and Google),
 * password reset, sign-out and session reads, against `/api/auth` on the
 * current origin.
 *
 * @remarks
 * The account forms call it directly rather than through Server Actions: it
 * already handles cookies, the OAuth redirect and extra request headers such
 * as the Turnstile token (`x-captcha-response`).
 *
 * @example
 * ```ts
 * await authClient.signIn.email(
 *   { email, password, callbackURL: "/en/learning" },
 *   { headers: { "x-captcha-response": token } },
 * );
 * ```
 *
 * @category Auth
 */
export const authClient = createAuthClient();
