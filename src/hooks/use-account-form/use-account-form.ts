"use client";

import { formErrors } from "@/lib/account-form-schemas/account-form-schemas";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { z } from "zod";

/**
 * The props an `AccountField` needs for one field of the form.
 *
 * @category Auth
 */
export type AccountFieldBinding = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
};

/**
 * Values, validation and translated field errors for one account form.
 *
 * @remarks
 * Errors appear only after `validate()` — a learner is not told a field is
 * wrong while still typing into it for the first time.
 *
 * `reset()` returns the form to those same initial values and clears the
 * errors — what a form that succeeded and stays on the page needs, so the
 * learner is not left looking at the password they just replaced.
 *
 * @param schema - The form's schema, from `account-form-schemas`
 * @param initialValues - Every field, empty
 * @returns The current values, a binding per field, `validate` and `reset`
 *
 * @example
 * ```tsx
 * const form = useAccountForm(signInSchema, { email: "", password: "" });
 * <AccountField {...form.field("email")} label={t("fields.email")} />
 * ```
 */
export function useAccountForm<Schema extends z.ZodObject, Values extends Record<string, string>>(
  schema: Schema,
  initialValues: Values,
) {
  const t = useTranslations("Account.validation");
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const validate = (): boolean => {
    const invalid = formErrors(schema, values) as Partial<Record<string, string>>;
    setErrors(invalid);
    return Object.keys(invalid).length === 0;
  };

  const reset = (): void => {
    setValues(initialValues);
    setErrors({});
  };

  const field = (name: keyof Values & string): AccountFieldBinding => ({
    name,
    value: values[name],
    onChange: (value) => setValues((current) => ({ ...current, [name]: value })),
    error: errors[name] && t(errors[name]),
  });

  return { values, field, validate, reset };
}
