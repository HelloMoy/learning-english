"use client";

import { cn } from "@/lib/utils/utils";

import { Turnstile } from "@marsidev/react-turnstile";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

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
 * On the development server the widget is always visible, in space the form
 * reserves for it, so you can see the challenge ran. In every other build it
 * uses Cloudflare's `interaction-only` appearance. It stays hidden and only
 * appears when Cloudflare needs the visitor to click. While hidden it is
 * `absolute`, so it takes no part in the parent's layout, not even a flex
 * `gap`. It rejoins the layout for good once Cloudflare surfaces it: before an
 * interactive check, or to report an error or an unsupported browser.
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
  const alwaysVisible = isDevelopmentServer();
  const [hasSurfaced, setHasSurfaced] = useState(false);
  const isHiddenByCloudflare = !alwaysVisible && !hasSurfaced;
  const surface = () => setHasSurfaced(true);
  const withdrawToken = () => onToken(null);

  return (
    <div
      role="group"
      aria-label={t("challenge")}
      className={cn(
        "flex justify-center",
        alwaysVisible && "min-h-[65px]",
        isHiddenByCloudflare && "absolute",
      )}
    >
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        onSuccess={onToken}
        onExpire={withdrawToken}
        onError={() => {
          withdrawToken();
          surface();
        }}
        onBeforeInteractive={surface}
        onUnsupported={surface}
        options={{
          language: locale,
          size: "flexible",
          appearance: alwaysVisible ? "always" : "interaction-only",
        }}
      />
    </div>
  );
}

function isDevelopmentServer(): boolean {
  return process.env.NODE_ENV === "development";
}
