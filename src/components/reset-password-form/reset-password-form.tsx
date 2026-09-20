"use client";

import { AccountConfirmation } from "@/components/account-confirmation/account-confirmation";
import { AccountField } from "@/components/account-field/account-field";
import { AccountSubmitArea } from "@/components/account-submit-area/account-submit-area";
import { useAccountForm } from "@/hooks/use-account-form/use-account-form";
import { useAccountSubmission } from "@/hooks/use-account-submission/use-account-submission";
import { Link, useRouter } from "@/i18n/navigation";
import { resetPasswordSchema } from "@/lib/account-form-schemas/account-form-schemas";
import { authClient } from "@/lib/auth-client/auth-client";

import { useTranslations } from "next-intl";
import type { FormEvent } from "react";

/**
 * Props for {@link ResetPasswordForm}.
 */
export type ResetPasswordFormProps = {
  /**
   * The token from the emailed link, or `undefined` when Better Auth already
   * reported the link as invalid.
   */
  token: string | undefined;
};

/**
 * Sets a new password with the token from a reset email.
 *
 * @remarks
 * Not challenged: holding the emailed token already proves control of the
 * address. A missing, used or expired token shows the invalid-link state with
 * a way to request a new email. On success the learner goes to sign-in, which
 * confirms the change; the reset has signed them out everywhere else.
 *
 * @example
 * ```tsx
 * <ResetPasswordForm token={searchParams.token} />
 * ```
 */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("Account");
  const router = useRouter();
  const form = useAccountForm(resetPasswordSchema, { password: "" });
  const submission = useAccountSubmission({ challenged: false });

  if (!token || submission.errorKey === "invalidToken") {
    return (
      <AccountConfirmation
        title={t("resetPassword.invalidTitle")}
        message={t("resetPassword.invalidBody")}
        action={
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground underline underline-offset-4"
          >
            {t("resetPassword.requestNew")}
          </Link>
        }
      />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate()) return;
    const saved = await submission.run((fetchOptions) =>
      authClient.resetPassword({ newPassword: form.values.password, token }, fetchOptions),
    );
    if (saved) router.replace("/sign-in?reset=done");
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <AccountField
        {...form.field("password")}
        type="password"
        label={t("fields.newPassword")}
        hint={t("fields.passwordHint")}
        autoComplete="new-password"
      />
      <AccountSubmitArea
        submission={submission}
        challenged={false}
        label={t("resetPassword.submit")}
        pendingLabel={t("resetPassword.submitting")}
      />
    </form>
  );
}
