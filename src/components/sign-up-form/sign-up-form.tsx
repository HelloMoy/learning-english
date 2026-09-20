"use client";

import { AccountConfirmation } from "@/components/account-confirmation/account-confirmation";
import { AccountField } from "@/components/account-field/account-field";
import { AccountSubmitArea } from "@/components/account-submit-area/account-submit-area";
import { GoogleSignInButton } from "@/components/google-sign-in-button/google-sign-in-button";
import { useAccountForm } from "@/hooks/use-account-form/use-account-form";
import { useAccountSubmission } from "@/hooks/use-account-submission/use-account-submission";
import { getPathname } from "@/i18n/navigation";
import { signUpSchema } from "@/lib/account-form-schemas/account-form-schemas";
import { authClient } from "@/lib/auth-client/auth-client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

/**
 * Props for {@link SignUpForm}.
 */
export type SignUpFormProps = {
  /** Locale-less path the verification link returns to, already validated. */
  returnPath: string;
};

/**
 * Creates an account with a name, an email and a password, behind a
 * Turnstile challenge.
 *
 * @remarks
 * The account is not signed in: Better Auth emails a verification link, and
 * the form gives way to a "check your inbox" message naming the address.
 * Signing up with an address that already has an account shows the same
 * message — the server answers both the same way, so the form cannot tell
 * anyone which addresses are registered.
 *
 * @example
 * ```tsx
 * <SignUpForm returnPath="/learning" />
 * ```
 */
export function SignUpForm({ returnPath }: SignUpFormProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const form = useAccountForm(signUpSchema, { name: "", email: "", password: "" });
  const submission = useAccountSubmission({ challenged: true });
  const [sentTo, setSentTo] = useState<string>();

  if (sentTo) {
    return (
      <AccountConfirmation
        title={t("signUp.checkInboxTitle")}
        message={t("signUp.checkInboxBody", { email: sentTo })}
      />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate()) return;
    const callbackURL = getPathname({ href: returnPath, locale });
    const requested = await submission.run((fetchOptions) =>
      authClient.signUp.email({ ...form.values, callbackURL }, fetchOptions),
    );
    if (requested) setSentTo(form.values.email);
  };

  return (
    <div className="flex flex-col gap-5">
      <GoogleSignInButton returnPath={returnPath} />
      <p className="text-center text-xs tracking-wide text-muted-foreground uppercase">
        {t("divider")}
      </p>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <AccountField
          {...form.field("name")}
          label={t("fields.name")}
          autoComplete="name"
        />
        <AccountField
          {...form.field("email")}
          type="email"
          label={t("fields.email")}
          autoComplete="email"
        />
        <AccountField
          {...form.field("password")}
          type="password"
          label={t("fields.password")}
          hint={t("fields.passwordHint")}
          autoComplete="new-password"
        />
        <AccountSubmitArea
          submission={submission}
          challenged
          label={t("signUp.submit")}
          pendingLabel={t("signUp.submitting")}
        />
      </form>
    </div>
  );
}
