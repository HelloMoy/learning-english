"use client";

import { AccountField } from "@/components/account-field/account-field";
import { Button } from "@/components/ui/button/button";
import { useAccountForm } from "@/hooks/use-account-form/use-account-form";
import { useAccountSubmission } from "@/hooks/use-account-submission/use-account-submission";
import { getPathname } from "@/i18n/navigation";
import { changeEmailSchema } from "@/lib/account-form-schemas/account-form-schemas";
import { authClient } from "@/lib/auth-client/auth-client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

/**
 * Props for {@link ChangeEmailSection}.
 */
export type ChangeEmailSectionProps = {
  /** The address the account is registered with today. */
  currentEmail: string;
};

/**
 * The Profile page's email form: moves the account to a different address,
 * behind two links.
 *
 * @remarks
 * Submitting sends an approval link to the address the account holds **today**
 * — not to the requested one — and the confirmation names that address, so a
 * learner who mistyped is not told to check an inbox they cannot open. Only
 * when that link is followed does Better Auth ask the new address to confirm,
 * and only the second link moves the account.
 *
 * An address that already belongs to another account is answered exactly like
 * a free one, which is what keeps the form from telling anyone who is
 * registered. The address the account already holds is refused here, before
 * anything is sent.
 *
 * Render it only for an account that has a password; {@link AccountSection}
 * decides that.
 *
 * @example
 * ```tsx
 * <ChangeEmailSection currentEmail={account.email} />
 * ```
 *
 * @category Components
 */
export function ChangeEmailSection({ currentEmail }: ChangeEmailSectionProps) {
  const t = useTranslations("Profile.email");
  const errors = useTranslations("Account.errors");
  const locale = useLocale();
  const form = useAccountForm(changeEmailSchema(currentEmail), { newEmail: "" });
  const submission = useAccountSubmission({ challenged: false });
  const [hasAsked, setHasAsked] = useState(false);

  if (hasAsked) {
    return (
      <section
        aria-labelledby="change-email-heading"
        className="flex flex-col gap-2"
      >
        <ChangeEmailHeading />
        <p
          role="status"
          className="text-sm text-foreground"
        >
          {t("sent", { email: currentEmail })}
        </p>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate()) return;
    const callbackURL = getPathname({ href: "/profile", locale });
    const asked = await submission.run((fetchOptions) =>
      authClient.changeEmail({ newEmail: form.values.newEmail, callbackURL }, fetchOptions),
    );
    if (asked) setHasAsked(true);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="change-email-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <ChangeEmailHeading />
        <p className="text-sm text-muted-foreground">{t("description", { email: currentEmail })}</p>
      </div>
      <AccountField
        {...form.field("newEmail")}
        type="email"
        label={t("newLabel")}
        autoComplete="email"
      />
      {submission.errorKey ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {errors(submission.errorKey)}
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

function ChangeEmailHeading() {
  const t = useTranslations("Profile.email");

  return (
    <h3
      id="change-email-heading"
      className="text-base font-bold text-foreground"
    >
      {t("heading")}
    </h3>
  );
}
