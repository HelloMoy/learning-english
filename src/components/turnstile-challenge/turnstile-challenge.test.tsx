import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TurnstileChallenge } from "./turnstile-challenge";

type FakeTurnstileProps = {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  options?: { language?: string };
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
      </>
    );
  },
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  lastProps.current = undefined;
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
});
