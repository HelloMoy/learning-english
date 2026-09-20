"use client";

import { TurnstileChallenge } from "@/components/turnstile-challenge/turnstile-challenge";
import { Button } from "@/components/ui/button/button";
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

  return (
    <>
      {challenged ? (
        <TurnstileChallenge
          key={submission.challengeKey}
          onToken={submission.onToken}
        />
      ) : null}
      {submission.errorKey ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {t(submission.errorKey)}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={!submission.isReady}
      >
        {submission.isPending ? pendingLabel : label}
      </Button>
    </>
  );
}
