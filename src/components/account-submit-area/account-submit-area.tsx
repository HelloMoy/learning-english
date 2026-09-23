"use client";

import { AccountWait, useIsWaiting } from "@/components/account-wait/account-wait";
import { PendingButton } from "@/components/pending-button/pending-button";
import { TurnstileChallenge } from "@/components/turnstile-challenge/turnstile-challenge";
import type { AccountSubmission } from "@/hooks/use-account-submission/use-account-submission";

import { useTranslations } from "next-intl";

/**
 * Props for {@link AccountSubmitArea}.
 */
export type AccountSubmitAreaProps = {
  /** The form's submission state, from `useAccountSubmission`. */
  submission: AccountSubmission;
  /** Whether the endpoint requires a Turnstile token. */
  challenged: boolean;
  label: string;
  /** What the button says while the request is in flight. */
  pendingLabel: string;
};

/**
 * The end of every account form: the Turnstile challenge when the endpoint is
 * challenged, the announced error of the last refused attempt, and the submit
 * button, which stays disabled until the form may be sent.
 *
 * @remarks
 * While the surface is waiting, the challenge dims and goes inert along with
 * the fields — a passed challenge is the brightest thing left on the card
 * otherwise, and the learner can no longer act on it. The button stays lit,
 * because its arc and pending label are the wait.
 *
 * The button follows the *surface's* wait, not only the request's: sign-in goes
 * on waiting after its credentials are accepted, through the navigation, and
 * the button must not drop back to its resting label while the beam is still
 * sweeping.
 *
 * @example
 * ```tsx
 * <AccountSubmitArea submission={submission} challenged label={t("submit")} pendingLabel={t("submitting")} />
 * ```
 */
export function AccountSubmitArea({
  submission,
  challenged,
  label,
  pendingLabel,
}: AccountSubmitAreaProps) {
  const t = useTranslations("Account.errors");
  // A surface can go on waiting after its request has resolved — sign-in does,
  // through the navigation — and the button has to stay in flight with it
  const isWaiting = useIsWaiting() || submission.isPending;

  return (
    <>
      {challenged ? (
        <AccountWait.Paused>
          <TurnstileChallenge
            key={submission.challengeKey}
            onToken={submission.onToken}
          />
        </AccountWait.Paused>
      ) : null}
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
