import type { TurnstileChallengeProps } from "@/components/turnstile-challenge/turnstile-challenge";

/** The token {@link TurnstileChallenge} hands the form when "passed". */
export const PASSED_CHALLENGE_TOKEN = "passed-challenge-token";

/**
 * Stand-in for the Cloudflare widget in component tests: a button that passes
 * the challenge. Use it as the whole module:
 *
 * ```ts
 * vi.mock("@/components/turnstile-challenge/turnstile-challenge", () =>
 *   import("@/test-setup/stubs/turnstile-challenge"),
 * );
 * ```
 */
export function TurnstileChallenge({ onToken }: TurnstileChallengeProps) {
  return (
    <button
      type="button"
      onClick={() => onToken(PASSED_CHALLENGE_TOKEN)}
    >
      pass challenge
    </button>
  );
}
