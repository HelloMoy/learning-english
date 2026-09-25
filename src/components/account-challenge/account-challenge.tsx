"use client";

import { AccountWait } from "@/components/account-wait/account-wait";
import { TurnstileChallenge } from "@/components/turnstile-challenge/turnstile-challenge";
import type { AccountSubmission } from "@/hooks/use-account-submission/use-account-submission";

/**
 * Props for {@link AccountChallenge}.
 */
export type AccountChallengeProps = {
  /** The form's submission: it receives the token and says when to fetch a new one. */
  submission: Pick<AccountSubmission, "challengeKey" | "onToken">;
};

/**
 * The Turnstile challenge as the challenged account forms place it: last in
 * the form, under "Continue with Google" on sign-in and sign-up and under the
 * submit button on forgot-password.
 *
 * @remarks
 * The challenge is remounted whenever `submission.challengeKey` changes,
 * because a refused attempt spends the single-use token. It goes out of play
 * with the rest of the form while the request is in flight.
 *
 * Its `AccountWait.Paused` wrapper is `display: contents`, so the challenge
 * itself is the form's layout item. While Cloudflare keeps the widget hidden,
 * the challenge takes itself out of the layout, and no empty wrapper is left
 * behind to cost a `gap`. `inert` still reaches the widget; the dimming doesn't,
 * since it needs a box.
 *
 * @example
 * ```tsx
 * <GoogleSignInButton returnPath={returnPath} />
 * <AccountChallenge submission={submission} />
 * ```
 */
export function AccountChallenge({ submission }: AccountChallengeProps) {
  return (
    <AccountWait.Paused className="contents">
      <TurnstileChallenge
        key={submission.challengeKey}
        onToken={submission.onToken}
      />
    </AccountWait.Paused>
  );
}
