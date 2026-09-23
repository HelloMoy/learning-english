"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useLocale, useTranslations } from "next-intl";

/**
 * Props for {@link TurnstileChallenge}.
 */
export type TurnstileChallengeProps = {
  /**
   * Receives the challenge token once Cloudflare has passed the visitor, and
   * `null` whenever that token stops being usable (expired or errored). The
   * form sends the token as `x-captcha-response`.
   */
  onToken: (token: string | null) => void;
};

/**
 * Cloudflare Turnstile, the bot check on the sign-up, sign-in and
 * forgot-password forms.
 *
 * @remarks
 * Reads the public site key from `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; local
 * development and the e2e suite use Cloudflare's always-pass test key. The
 * widget is shown in the page's language and sits in a labelled group so
 * assistive technology can name it.
 *
 * A token is single-use: after a submission, remount the component (change
 * its `key`) to get a fresh one.
 *
 * @example
 * ```tsx
 * <TurnstileChallenge key={attempt} onToken={setToken} />
 * ```
 */
export function TurnstileChallenge({ onToken }: TurnstileChallengeProps) {
  const t = useTranslations("Account");
  const locale = useLocale();

  return (
    <div
      role="group"
      aria-label={t("challenge")}
      className="flex min-h-[65px] justify-center"
    >
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        onSuccess={onToken}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
        options={{ language: locale, size: "flexible" }}
      />
    </div>
  );
}
