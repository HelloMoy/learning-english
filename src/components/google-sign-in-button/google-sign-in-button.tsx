"use client";

import { Button } from "@/components/ui/button/button";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client/auth-client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Props for {@link GoogleSignInButton}.
 */
export type GoogleSignInButtonProps = {
  /** Locale-less path to open once signed in, already validated. */
  returnPath: string;
};

/**
 * "Continue with Google": starts the Google OAuth round-trip, which signs the
 * learner in (creating the account on first use, or linking it to an existing
 * account with the same address) and returns them to `returnPath` in the
 * current locale. A failed round-trip comes back to sign-in.
 *
 * @example
 * ```tsx
 * <GoogleSignInButton returnPath="/learning" />
 * ```
 */
export function GoogleSignInButton({ returnPath }: GoogleSignInButtonProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const startGoogleSignIn = async () => {
    setIsRedirecting(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: getPathname({ href: returnPath, locale }),
      errorCallbackURL: getPathname({ href: "/sign-in", locale }),
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-11 w-full"
      disabled={isRedirecting}
      onClick={startGoogleSignIn}
    >
      <GoogleMark />
      {t("google")}
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
