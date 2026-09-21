"use client";

import { AccountField } from "@/components/account-field/account-field";
import { Button } from "@/components/ui/button/button";
import { useAccountForm } from "@/hooks/use-account-form/use-account-form";
import { useAccountSubmission } from "@/hooks/use-account-submission/use-account-submission";
import { changePasswordSchema } from "@/lib/account-form-schemas/account-form-schemas";
import { authClient } from "@/lib/auth-client/auth-client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const EMPTY = { currentPassword: "", newPassword: "" };

/**
 * The Profile page's password form: replaces the account's password without
 * signing the learner out here.
 *
 * @remarks
 * The current password is what authorizes the change, so a borrowed session
 * cannot make one. A successful change revokes every other session — the
 * point of changing a password you suspect — and Better Auth hands this
 * browser a fresh one, so the learner stays where they are. Both fields are
 * cleared and the outcome is announced as a status.
 *
 * Refusals are shown as an alert and the fields keep what the learner typed,
 * so a mistyped current password costs one field, not the whole form.
 *
 * Render it only for an account that has a password; {@link AccountSection}
 * decides that.
 *
 * @example
 * ```tsx
 * <ChangePasswordSection />
 * ```
 *
 * @category Components
 */
export function ChangePasswordSection() {
  const t = useTranslations("Profile.password");
  const errors = useTranslations("Account.errors");
  const form = useAccountForm(changePasswordSchema, EMPTY);
  const submission = useAccountSubmission({ challenged: false });
  const [hasChanged, setHasChanged] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasChanged(false);
    if (!form.validate()) return;
    const changed = await submission.run((fetchOptions) =>
      authClient.changePassword({ ...form.values, revokeOtherSessions: true }, fetchOptions),
    );
    if (!changed) return;
    form.reset();
    setHasChanged(true);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="change-password-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h3
          id="change-password-heading"
          className="text-base font-bold text-foreground"
        >
          {t("heading")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <AccountField
        {...form.field("currentPassword")}
        type="password"
        label={t("currentLabel")}
        autoComplete="current-password"
      />
      <AccountField
        {...form.field("newPassword")}
        type="password"
        label={t("newLabel")}
        hint={t("hint")}
        autoComplete="new-password"
      />
      {submission.errorKey ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {errors(submission.errorKey)}
        </p>
      ) : null}
      {hasChanged ? (
        <p
          role="status"
          className="text-sm text-foreground"
        >
          {t("changed")}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={!submission.isReady}
        className="min-h-11 self-start px-5 font-bold"
      >
        {submission.isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
