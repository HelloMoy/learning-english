import { AccountWait } from "@/components/account-wait/account-wait";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { PASSED_CHALLENGE_TOKEN } from "@/test-setup/stubs/turnstile-challenge";

import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, test, vi } from "vitest";

import { AccountChallenge } from "./account-challenge";

const mounts = vi.hoisted(() => ({ count: 0 }));

vi.mock("@/components/turnstile-challenge/turnstile-challenge", async () => {
  const stub = await import("@/test-setup/stubs/turnstile-challenge");
  return {
    TurnstileChallenge: (props: Parameters<typeof stub.TurnstileChallenge>[0]) => {
      useEffect(() => {
        mounts.count += 1;
      }, []);
      return stub.TurnstileChallenge(props);
    },
  };
});

describe("AccountChallenge", () => {
  test("WHEN the challenge passes THEN the token reaches the submission", async () => {
    const onToken = vi.fn();
    renderInLocale(<AccountChallenge submission={{ challengeKey: 0, onToken }} />);

    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    expect(onToken).toHaveBeenCalledWith(PASSED_CHALLENGE_TOKEN);
  });

  test("WHEN the submission spends its token THEN the challenge is remounted for a new one", () => {
    const challengeKey = faker.number.int({ max: 100 });
    const { rerender } = renderInLocale(
      <AccountChallenge submission={{ challengeKey, onToken: vi.fn() }} />,
    );
    const mountsBefore = mounts.count;

    rerender(
      <AccountChallenge submission={{ challengeKey: challengeKey + 1, onToken: vi.fn() }} />,
    );

    expect(mounts.count).toBe(mountsBefore + 1);
  });

  test("WHEN the request is in flight THEN the challenge goes out of play", () => {
    renderInLocale(
      <AccountWait busy>
        <AccountChallenge submission={{ challengeKey: 0, onToken: vi.fn() }} />
      </AccountWait>,
    );

    expect(
      screen.getByRole("button", { name: "pass challenge" }).closest("[inert]"),
    ).not.toBeNull();
  });

  test("WHEN at rest THEN the challenge is live", () => {
    renderInLocale(
      <AccountWait busy={false}>
        <AccountChallenge submission={{ challengeKey: 0, onToken: vi.fn() }} />
      </AccountWait>,
    );

    expect(screen.getByRole("button", { name: "pass challenge" }).closest("[inert]")).toBeNull();
  });

  test("WHEN placed in a form THEN its wrapper makes no box, so the challenge itself is the layout item", () => {
    renderInLocale(<AccountChallenge submission={{ challengeKey: 0, onToken: vi.fn() }} />);

    expect(screen.getByTestId("account-wait-paused")).toHaveClass("contents");
  });
});
