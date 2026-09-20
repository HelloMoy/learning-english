import { authClient } from "@/lib/auth-client/auth-client";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { GoogleSignInButton } from "./google-sign-in-button";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { signIn: { social: vi.fn() } },
}));

beforeEach(() => {
  vi.mocked(authClient.signIn.social).mockReset();
  localizeGetPathname();
});

describe("GoogleSignInButton", () => {
  test("WHEN pressed THEN Google sign-in starts, returning to the localized destination", async () => {
    renderInLocale(<GoogleSignInButton returnPath="/courses/basics" />, "es");

    await userEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/es/courses/basics",
      errorCallbackURL: "/es/sign-in",
    });
  });

  test("WHEN pressed THEN it cannot be pressed twice while Google opens", async () => {
    vi.mocked(authClient.signIn.social).mockReturnValue(new Promise(() => {}) as never);
    renderInLocale(<GoogleSignInButton returnPath="/learning" />);

    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
  });
});
