import { AccountWait } from "@/components/account-wait/account-wait";
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
  test("WHEN rendered THEN it carries no challenge, which the form places on its own", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission()}
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.queryByRole("button", { name: "pass challenge" })).not.toBeInTheDocument();
  });

  test("WHEN the submission is not ready THEN the button is disabled", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission({ isReady: false })}
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
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });

  test("WHEN in flight THEN the button turns its arc", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission({ isPending: true, isReady: false })}
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.getByTestId("spinner-arc")).toBeInTheDocument();
  });

  test("WHEN at rest THEN there is no arc to distract from the label", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission()}
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.queryByTestId("spinner-arc")).not.toBeInTheDocument();
  });

  test("WHEN the surface waits on past the response THEN the button stays in flight", () => {
    // Sign-in keeps waiting after its credentials are accepted, until the
    // navigation takes the page — the button must not drop back to its resting
    // label while the beam is still sweeping behind it
    renderInLocale(
      <AccountWait busy>
        <AccountSubmitArea
          submission={submission({ isPending: false, isReady: true })}
          label="Sign in"
          pendingLabel="Signing in…"
        />
      </AccountWait>,
    );

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    expect(screen.getByTestId("spinner-arc")).toBeInTheDocument();
  });

  test("WHEN there is no surrounding wait THEN the request alone decides", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission()}
        label="Sign in"
        pendingLabel="Signing in…"
      />,
    );

    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  test("WHEN refused THEN the translated error is announced", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission({ errorKey: "captchaFailed" })}
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
