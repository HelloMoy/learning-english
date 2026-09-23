"use client";

import {
  accountErrorKey,
  type AccountErrorKey,
  type AuthClientError,
} from "@/lib/account-error-key/account-error-key";

import { useLocale } from "next-intl";
import { useState } from "react";

/**
 * What an account request is sent with: the Turnstile token header when the
 * endpoint is challenged, nothing otherwise.
 *
 * @category Auth
 */
export type AccountFetchOptions = { headers?: Record<string, string> };

/**
 * An auth-client call, bound to its form values, taking the fetch options.
 *
 * @category Auth
 */
export type AccountRequest = (
  fetchOptions: AccountFetchOptions,
) => Promise<{ error: AuthClientError | null }>;

/**
 * The submission state of one account form.
 *
 * @category Auth
 */
export type AccountSubmission = {
  /** Whether the form may be submitted: not in flight, and challenge passed when challenged. */
  isReady: boolean;
  isPending: boolean;
  /** The `Account.errors` key of the last refusal, cleared on the next attempt. */
  errorKey: AccountErrorKey | undefined;
  /** Remount the `TurnstileChallenge` with this key; it changes when a token is spent. */
  challengeKey: number;
  onToken: (token: string | null) => void;
  /** Runs the request; resolves `true` when the server accepted it. */
  run: (request: AccountRequest) => Promise<boolean>;
};

/**
 * The submission mechanics every account form shares.
 *
 * @remarks
 * Holds the Turnstile token and sends it as `x-captcha-response`, tracks the
 * request in flight, and turns a refusal into an `Account.errors` key. A
 * Turnstile token is single-use, so a refused attempt spends it: the token is
 * dropped and `challengeKey` changes, which remounts the widget for a new one.
 *
 * Every request also states the locale as `x-app-locale`. The endpoints that
 * email on success — a changed password, a completed reset — run their
 * callbacks outside any request, so the browser is the only one that knows
 * which of the three catalogues the message should be written in.
 *
 * @param options - `challenged`: whether the endpoint requires a Turnstile token
 * @returns The submission state and `run`
 */
export function useAccountSubmission({ challenged }: { challenged: boolean }): AccountSubmission {
  const locale = useLocale();
  const [token, setToken] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorKey, setErrorKey] = useState<AccountErrorKey>();
  const [challengeKey, setChallengeKey] = useState(0);

  const refuse = (key: AccountErrorKey): false => {
    setErrorKey(key);
    setToken(null);
    setChallengeKey((current) => current + 1);
    setIsPending(false);
    return false;
  };

  const run = async (request: AccountRequest): Promise<boolean> => {
    setErrorKey(undefined);
    setIsPending(true);
    try {
      const { error } = await request({
        headers: {
          ...(challenged && token ? { "x-captcha-response": token } : {}),
          "x-app-locale": locale,
        },
      });
      if (error) return refuse(accountErrorKey(error));
      setIsPending(false);
      return true;
    } catch {
      return refuse("generic");
    }
  };

  return {
    isReady: !isPending && (!challenged || token !== null),
    isPending,
    errorKey,
    challengeKey,
    onToken: setToken,
    run,
  };
}
