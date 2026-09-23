import { MESSAGES } from "@/test-setup/render-in-locale";

import { act, renderHook as render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import { useAccountSubmission } from "./use-account-submission";

/** Every account form renders inside the locale provider; the hook reads it. */
const renderHook: typeof render = (callback, options) =>
  render(callback, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider
        locale="es"
        messages={MESSAGES.es}
      >
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });

describe("useAccountSubmission", () => {
  test("WHEN challenged and no token has arrived THEN it is not ready", () => {
    const { result } = renderHook(() => useAccountSubmission({ challenged: true }));

    expect(result.current.isReady).toBe(false);
  });

  test("WHEN not challenged THEN it is ready at once", () => {
    const { result } = renderHook(() => useAccountSubmission({ challenged: false }));

    expect(result.current.isReady).toBe(true);
  });

  test("WHEN a request runs THEN it carries the challenge token as x-captcha-response", async () => {
    const request = vi.fn().mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAccountSubmission({ challenged: true }));
    act(() => result.current.onToken("token-1"));

    await act(() => result.current.run(request));

    expect(request).toHaveBeenCalledWith({
      headers: { "x-captcha-response": "token-1", "x-app-locale": "es" },
    });
  });

  test("WHEN a request runs THEN it states the locale the learner is acting in", async () => {
    // The endpoints that email on success run outside any request locale, so
    // the browser is the only one that knows which language to write in.
    const request = vi.fn().mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAccountSubmission({ challenged: false }));

    await act(() => result.current.run(request));

    expect(request).toHaveBeenCalledWith({ headers: { "x-app-locale": "es" } });
  });

  test("WHEN the request succeeds THEN run reports success and no error", async () => {
    const { result } = renderHook(() => useAccountSubmission({ challenged: false }));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.run(async () => ({ error: null }));
    });

    expect(succeeded).toBe(true);
    expect(result.current.errorKey).toBeUndefined();
  });

  test("WHEN the server refuses THEN its message key is set, the token is spent and a new challenge is asked for", async () => {
    const { result } = renderHook(() => useAccountSubmission({ challenged: true }));
    act(() => result.current.onToken("token-1"));
    const keyBefore = result.current.challengeKey;

    await act(() =>
      result.current.run(async () => ({
        error: { code: "INVALID_EMAIL_OR_PASSWORD", status: 401 },
      })),
    );

    expect(result.current.errorKey).toBe("invalidCredentials");
    expect(result.current.isReady).toBe(false);
    expect(result.current.challengeKey).not.toBe(keyBefore);
    expect(result.current.isPending).toBe(false);
  });

  test("WHEN the request throws THEN the generic message is shown", async () => {
    const { result } = renderHook(() => useAccountSubmission({ challenged: false }));

    await act(() => result.current.run(async () => Promise.reject(new Error("offline"))));

    expect(result.current.errorKey).toBe("generic");
  });

  test("WHILE a request is in flight THEN it is pending", async () => {
    let resolve: (value: { error: null }) => void = () => {};
    const { result } = renderHook(() => useAccountSubmission({ challenged: false }));

    act(() => {
      void result.current.run(() => new Promise((done) => (resolve = done)));
    });

    expect(result.current.isPending).toBe(true);
    await act(async () => resolve({ error: null }));
  });
});
