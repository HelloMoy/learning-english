import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { TurnstileChallenge } from "./turnstile-challenge";

type FakeTurnstileProps = {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  onBeforeInteractive?: () => void;
  onUnsupported?: () => void;
  options?: { language?: string; appearance?: string };
};

const lastProps: { current?: FakeTurnstileProps } = {};

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: (props: FakeTurnstileProps) => {
    lastProps.current = props;
    return (
      <>
        <button onClick={() => props.onSuccess?.("token-1")}>solve</button>
        <button onClick={() => props.onExpire?.()}>expire</button>
        <button onClick={() => props.onError?.()}>fail</button>
        <button onClick={() => props.onBeforeInteractive?.()}>ask for a click</button>
        <button onClick={() => props.onUnsupported?.()}>unsupported</button>
      </>
    );
  },
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  lastProps.current = undefined;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("TurnstileChallenge", () => {
  test("WHEN the challenge passes THEN its token is handed to the form", async () => {
    const onToken = vi.fn();
    renderInLocale(<TurnstileChallenge onToken={onToken} />);

    await userEvent.click(screen.getByRole("button", { name: "solve" }));

    expect(onToken).toHaveBeenCalledWith("token-1");
  });

  test.each(["expire", "fail"])(
    "WHEN the challenge fires %s THEN the token is withdrawn",
    async (event) => {
      const onToken = vi.fn();
      renderInLocale(<TurnstileChallenge onToken={onToken} />);

      await userEvent.click(screen.getByRole("button", { name: event }));

      expect(onToken).toHaveBeenCalledWith(null);
    },
  );

  test("WHEN it renders THEN it uses the public site key and the page's language", () => {
    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />, "pt");

    expect(lastProps.current?.siteKey).toBe("site-key");
    expect(lastProps.current?.options?.language).toBe("pt");
  });

  test("WHEN it renders THEN the widget sits in a region named for assistive technology", () => {
    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />, "es");

    expect(screen.getByRole("group", { name: "Verificación de seguridad" })).toBeInTheDocument();
  });

  test("WHEN it renders in a production build THEN the widget only appears if the visitor must interact", () => {
    vi.stubEnv("NODE_ENV", "production");

    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />);

    expect(lastProps.current?.options?.appearance).toBe("interaction-only");
  });

  test("WHEN it renders on the development server THEN the widget is always visible", () => {
    vi.stubEnv("NODE_ENV", "development");

    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />);

    expect(lastProps.current?.options?.appearance).toBe("always");
  });

  test("WHEN it renders on the development server THEN the form reserves the widget's height", () => {
    vi.stubEnv("NODE_ENV", "development");

    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Security check" })).toHaveClass("min-h-[65px]");
  });

  test("WHEN it renders in a production build THEN the hidden widget leaves no gap", () => {
    vi.stubEnv("NODE_ENV", "production");

    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Security check" })).not.toHaveClass("min-h-[65px]");
  });

  test("WHEN it renders in a production build THEN the hidden widget takes no part in the layout", () => {
    vi.stubEnv("NODE_ENV", "production");

    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Security check" })).toHaveClass("absolute");
  });

  test.each(["ask for a click", "fail", "unsupported"])(
    "WHEN a production widget fires %s THEN it rejoins the layout",
    async (event) => {
      vi.stubEnv("NODE_ENV", "production");
      renderInLocale(<TurnstileChallenge onToken={vi.fn()} />);

      await userEvent.click(screen.getByRole("button", { name: event }));

      expect(screen.getByRole("group", { name: "Security check" })).not.toHaveClass("absolute");
    },
  );

  test("WHEN it renders on the development server THEN the widget stays in the layout", () => {
    vi.stubEnv("NODE_ENV", "development");

    renderInLocale(<TurnstileChallenge onToken={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Security check" })).not.toHaveClass("absolute");
  });
});
