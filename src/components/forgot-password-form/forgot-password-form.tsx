"use client";

import { AccountConfirmation } from "@/components/account-confirmation/account-confirmation";
import { AccountField } from "@/components/account-field/account-field";
import { AccountSubmitArea } from "@/components/account-submit-area/account-submit-area";
import { AccountWait } from "@/components/account-wait/account-wait";
import { useAccountForm } from "@/hooks/use-account-form/use-account-form";
import { useAccountSubmission } from "@/hooks/use-account-submission/use-account-submission";
import { getPathname } from "@/i18n/navigation";
import { forgotPasswordSchema } from "@/lib/account-form-schemas/account-form-schemas";
import { authClient } from "@/lib/auth-client/auth-client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

/**
 * Requests a password-reset email, behind a Turnstile challenge.
 *
 * @remarks
 * The reset link returns to this locale's reset page, and the email is written
 * in this locale. Once the request is accepted the form gives way to the same
 * confirmation whether or not the address has an account, so it cannot be
 * used to find out which addresses are registered.
 *
 * @example
 * ```tsx
 * <ForgotPasswordForm />
 * ```
 */
export function ForgotPasswordForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const form = useAccountForm(forgotPasswordSchema, { email: "" });
  const submission = useAccountSubmission({ challenged: true });
  const [sentTo, setSentTo] = useState<string>();

  if (sentTo) {
    return (
      <AccountConfirmation
        title={t("forgotPassword.sentTitle")}
        message={t("forgotPassword.sentBody", { email: sentTo })}
      />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate()) return;
    const redirectTo = getPathname({ href: "/reset-password", locale });
    const requested = await submission.run((fetchOptions) =>
      authClient.requestPasswordReset({ email: form.values.email, redirectTo }, fetchOptions),
    );
    if (requested) setSentTo(form.values.email);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <AccountWait busy={submission.isPending}>
        <AccountWait.Paused>
          <AccountField
            {...form.field("email")}
            type="email"
            label={t("fields.email")}
            autoComplete="email"
          />
        </AccountWait.Paused>
        <AccountSubmitArea
          submission={submission}
          challenged
          label={t("forgotPassword.submit")}
          pendingLabel={t("forgotPassword.submitting")}
        />
        <AccountWait.Status>{t("forgotPassword.waiting")}</AccountWait.Status>
      </AccountWait>
    </form>
  );
}
