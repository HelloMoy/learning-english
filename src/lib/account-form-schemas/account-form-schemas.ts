import { LEARNER_NAME_MAX_LENGTH } from "@/domain/entities/learner-profile/learner-profile";

import { z } from "zod";

const PASSWORD_LENGTH = { min: 8, max: 128 } as const;

// Every issue message is an `Account.validation.*` key, not copy: the form
// translates it, so the schemas stay locale-free.
const email = z
  .string()
  .trim()
  .pipe(z.email({ error: "emailInvalid" }));
const password = z
  .string()
  .min(PASSWORD_LENGTH.min, { error: "passwordLength" })
  .max(PASSWORD_LENGTH.max, { error: "passwordLength" });
const name = z
  .string()
  .trim()
  .min(1, { error: "nameRequired" })
  .max(LEARNER_NAME_MAX_LENGTH, { error: "nameTooLong" });

/** The sign-up form: a name, an email and a new password. */
export const signUpSchema = z.object({ name, email, password });

/** The sign-in form: an email and a password. */
export const signInSchema = z.object({ email, password });

/** The forgot-password form: an email. */
export const forgotPasswordSchema = z.object({ email });

/** The reset-password form: the new password. */
export const resetPasswordSchema = z.object({ password });

/**
 * An `Account.validation.*` key.
 *
 * @category Auth
 */
export type AccountValidationKey =
  "emailInvalid" | "passwordLength" | "nameRequired" | "nameTooLong";

/**
 * Validates form values and reports, per field, the first problem found.
 *
 * @param schema - One of the account form schemas
 * @param values - The raw form values
 * @returns An object with one `Account.validation` key per invalid field; empty when valid
 *
 * @category Auth
 */
export function formErrors<Schema extends z.ZodObject>(
  schema: Schema,
  values: unknown,
): Partial<Record<keyof z.infer<Schema>, AccountValidationKey>> {
  const result = schema.safeParse(values);
  if (result.success) return {};

  const errors: Partial<Record<string, AccountValidationKey>> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    errors[field] ??= issue.message as AccountValidationKey;
  }
  return errors as Partial<Record<keyof z.infer<Schema>, AccountValidationKey>>;
}
