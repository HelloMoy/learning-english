"use client";

import { AccountField } from "@/components/account-field/account-field";
import { AccountSubmitArea } from "@/components/account-submit-area/account-submit-area";
import { AccountWait } from "@/components/account-wait/account-wait";
import { GoogleSignInButton } from "@/components/google-sign-in-button/google-sign-in-button";
import { useAccountForm } from "@/hooks/use-account-form/use-account-form";
import { useAccountSubmission } from "@/hooks/use-account-submission/use-account-submission";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { signInSchema } from "@/lib/account-form-schemas/account-form-schemas";
import { authClient } from "@/lib/auth-client/auth-client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

/**
 * Props for {@link SignInForm}.
 */
export type SignInFormProps = {
  /** Locale-less path to open once signed in, already validated. */
  returnPath: string;
  /** Show the "password updated" confirmation, after a reset. */
  passwordUpdated?: boolean;
};

/**
 * Signs a verified learner in with email and password, behind a Turnstile
 * challenge, or with Google.
 *
 * @remarks
 * A wrong email and a wrong password produce the same message, because the
 * server answers both the same way. On success the learner is sent to
 * `returnPath` and the server tree is refreshed, so the header and every
 * layout render as signed in.
 *
 * The wait runs from the moment the form is submitted until the navigation
 * takes the page away — `isLeaving` covers the gap between the credentials
 * being accepted and the route changing, so the form never flashes back into
 * view. Only a refusal returns it, with the learner's typing intact.
 *
 * The wait does not survive the navigation, and cannot: the destination's
 * `loading.tsx` is a Suspense boundary the App Router mounts as soon as the
 * route suspends, so it replaces this page whatever the navigation is wrapped
 * in — a transition included. The destination's shell carries the wait from
 * there, and the two read as one sequence.
 *
 * @example
 * ```tsx
 * <SignInForm returnPath="/courses/basics" />
 * ```
 */
export function SignInForm({ returnPath, passwordUpdated = false }: SignInFormProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const router = useRouter();
  const form = useAccountForm(signInSchema, { email: "", password: "" });
  const submission = useAccountSubmission({ challenged: true });
  const [isLeaving, setIsLeaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.validate()) return;
    const callbackURL = getPathname({ href: returnPath, locale });
    const signedIn = await submission.run((fetchOptions) =>
      authClient.signIn.email({ ...form.values, callbackURL }, fetchOptions),
    );
    if (!signedIn) return;
    setIsLeaving(true);
    router.replace(returnPath);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <AccountWait busy={submission.isPending || isLeaving}>
        <AccountWait.Paused className="flex flex-col gap-5">
          {passwordUpdated ? (
            <p
              role="status"
              className="rounded-lg bg-muted px-3 py-2 text-center text-sm text-foreground"
            >
              {t("signIn.passwordUpdated")}
            </p>
          ) : null}
          <GoogleSignInButton returnPath={returnPath} />
          <p className="text-center text-xs tracking-wide text-muted-foreground uppercase">
            {t("divider")}
          </p>
        </AccountWait.Paused>
        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <AccountWait.Paused className="flex flex-col gap-4">
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
              autoComplete="current-password"
            />
            <Link
              href="/forgot-password"
              className="self-end text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("signIn.forgot")}
            </Link>
          </AccountWait.Paused>
          <AccountSubmitArea
            submission={submission}
            challenged
            label={t("signIn.submit")}
            pendingLabel={t("signIn.submitting")}
          />
        </form>
        <AccountWait.Status>{t("signIn.waiting")}</AccountWait.Status>
      </AccountWait>
    </div>
  );
}
