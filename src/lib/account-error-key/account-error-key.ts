const TOO_MANY_REQUESTS = 429;

const KEY_BY_CODE = {
  INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
  EMAIL_NOT_VERIFIED: "emailNotVerified",
  VERIFICATION_FAILED: "captchaFailed",
  MISSING_RESPONSE: "captchaFailed",
  INVALID_TOKEN: "invalidToken",
  PASSWORD_TOO_SHORT: "passwordLength",
  PASSWORD_TOO_LONG: "passwordLength",
} as const;

/**
 * The `Account.errors.*` message key for a refusal.
 *
 * @category Auth
 */
export type AccountErrorKey =
  (typeof KEY_BY_CODE)[keyof typeof KEY_BY_CODE] | "tooManyRequests" | "generic";

/**
 * The shape of an error the Better Auth client returns.
 *
 * @category Auth
 */
export type AuthClientError = { code?: string; status: number };

/**
 * Translates a Better Auth refusal into the key of a localized message, so no
 * raw server text ever reaches a learner.
 *
 * @remarks
 * The rate limiter answers `429` without a code, hence the status check. Any
 * code this map does not know falls back to the generic message.
 *
 * @param error - The error the auth client returned
 * @returns The `Account.errors` key to show
 *
 * @category Auth
 */
export function accountErrorKey(error: AuthClientError): AccountErrorKey {
  if (error.status === TOO_MANY_REQUESTS) return "tooManyRequests";
  return KEY_BY_CODE[error.code as keyof typeof KEY_BY_CODE] ?? "generic";
}
