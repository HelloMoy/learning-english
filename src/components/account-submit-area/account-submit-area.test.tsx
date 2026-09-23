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

  test("WHEN in flight THEN the button turns its arc", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission({ isPending: true, isReady: false })}
        challenged
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
        challenged
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
          challenged
          label="Sign in"
          pendingLabel="Signing in…"
        />
      </AccountWait>,
    );

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    expect(screen.getByTestId("spinner-arc")).toBeInTheDocument();
  });

  test("WHEN the request is in flight THEN the passed challenge goes out of play with the fields", () => {
    // It is the brightest thing left on the card once the fields dim, and the
    // learner can no longer act on it — it belongs with the rest of the pause
    renderInLocale(
      <AccountWait busy>
        <AccountSubmitArea
          submission={submission({ isPending: true, isReady: false })}
          challenged
          label="Sign in"
          pendingLabel="Signing in…"
        />
      </AccountWait>,
    );

    const challenge = screen.getByRole("button", { name: "pass challenge" });
    expect(challenge.closest("[inert]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Signing in…" }).closest("[inert]")).toBeNull();
  });

  test("WHEN at rest THEN the challenge is live", () => {
    renderInLocale(
      <AccountWait busy={false}>
        <AccountSubmitArea
          submission={submission()}
          challenged
          label="Sign in"
          pendingLabel="Signing in…"
        />
      </AccountWait>,
    );

    expect(screen.getByRole("button", { name: "pass challenge" }).closest("[inert]")).toBeNull();
  });

  test("WHEN there is no surrounding wait THEN the request alone decides", () => {
    renderInLocale(
      <AccountSubmitArea
        submission={submission()}
        challenged
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
