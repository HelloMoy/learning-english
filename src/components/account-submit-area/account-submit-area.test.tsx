import type { AccountSubmission } from "@/hooks/use-account-submission/use-account-submission";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { AccountSubmitArea } from "./account-submit-area";

vi.mock(
  "@/components/turnstile-challenge/turnstile-challenge",
  () => import("@/test-setup/stubs/turnstile-challenge"),
);

const submission = (overrides: Partial<AccountSubmission> = {}): AccountSubmission => ({
  isReady: true,
  isPending: false,
  errorKey: undefined,
  challengeKey: 0,
  onToken: vi.fn(),
  run: vi.fn(),
  ...overrides,
});

describe("AccountSubmitArea", () => {
  test("WHEN challenged THEN the challenge sits above the submit button", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission()}
        challenged
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.getByRole("button", { name: "pass challenge" })).toBeInTheDocument();
  });

  test("WHEN not challenged THEN there is no challenge", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission()}
        challenged={false}
        label="Save"
        pendingLabel="Saving…"
      />,
    );

    expect(screen.queryByRole("button", { name: "pass challenge" })).not.toBeInTheDocument();
  });

  test("WHEN the submission is not ready THEN the button is disabled", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission({ isReady: false })}
        challenged
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  test("WHEN in flight THEN the button says so", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission({ isPending: true, isReady: false })}
        challenged
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });

  test("WHEN refused THEN the translated error is announced", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission({ errorKey: "captchaFailed" })}
        challenged
        label="Entrar"
        pendingLabel="Entrando…"
      />,
      "pt",
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "A verificação de segurança não passou. Tente de novo.",
    );
  });
});
