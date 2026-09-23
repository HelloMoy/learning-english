import { MESSAGES } from "@/test-setup/render-in-locale";

import * as Sentry from "@sentry/nextjs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { GlobalErrorFallback } from "./global-error-fallback";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.mocked(Sentry.captureException).mockClear();
});

describe("GlobalErrorFallback", () => {
  test("WHEN the failed page was Portuguese THEN the fallback speaks Portuguese, with no intl provider", async () => {
    window.history.replaceState(null, "", "/pt/profile");

    render(
      <GlobalErrorFallback
        error={new Error("boom")}
        retry={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: MESSAGES.pt.GlobalError.title }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("pt");
  });

  test("WHEN the path carries no locale THEN the fallback uses the default one", async () => {
    render(
      <GlobalErrorFallback
        error={new Error("boom")}
        retry={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: MESSAGES.en.GlobalError.title }),
    ).toBeInTheDocument();
  });

  test("WHEN it renders THEN the error is reported", () => {
    const error = new Error("boom");

    render(
      <GlobalErrorFallback
        error={error}
        retry={vi.fn()}
      />,
    );

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  test("WHEN the learner retries THEN the page is asked to render again", async () => {
    const retry = vi.fn();
    render(
      <GlobalErrorFallback
        error={new Error("boom")}
        retry={retry}
      />,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: MESSAGES.en.GlobalError.retry }),
    );

    expect(retry).toHaveBeenCalledOnce();
  });
});
