"use client";

import { useIsWaiting } from "@/components/account-wait/account-wait";
import { PendingButton } from "@/components/pending-button/pending-button";
import type { AccountSubmission } from "@/hooks/use-account-submission/use-account-submission";

import { useTranslations } from "next-intl";

/**
 * Props for {@link AccountSubmitArea}.
 */
export type AccountSubmitAreaProps = {
  /** The form's submission state, from `useAccountSubmission`. */
  submission: AccountSubmission;
  label: string;
  /** What the button says while the request is in flight. */
  pendingLabel: string;
};

/**
 * The end of every account form's fields: the announced error of the last
 * refused attempt, and the submit button, which stays disabled until the form
 * may be sent. A challenged form places its Turnstile challenge on its own,
 * with `AccountChallenge`.
 *
 * @remarks
 * While the surface is waiting, the button stays lit, because its arc and
 * pending label are the wait.
 *
 * The button follows the *surface's* wait, not only the request's: sign-in goes
 * on waiting after its credentials are accepted, through the navigation, and
 * the button must not drop back to its resting label while the beam is still
 * sweeping.
 *
 * @example
 * ```tsx
 * <AccountSubmitArea submission={submission} label={t("submit")} pendingLabel={t("submitting")} />
 * ```
 */
export function AccountSubmitArea({ submission, label, pendingLabel }: AccountSubmitAreaProps) {
  const t = useTranslations("Account.errors");
  // A surface can go on waiting after its request has resolved — sign-in does,
  // through the navigation — and the button has to stay in flight with it
  const isWaiting = useIsWaiting() || submission.isPending;

  return (
    <>
      {submission.errorKey ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {t(submission.errorKey)}
        </p>
      ) : null}
      <PendingButton
        type="submit"
        size="lg"
        className="h-11 w-full"
        isPending={isWaiting}
        disabled={!submission.isReady}
        label={label}
        pendingLabel={pendingLabel}
      />
    </>
  );
}
