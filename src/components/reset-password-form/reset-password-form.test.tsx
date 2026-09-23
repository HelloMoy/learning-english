import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client/auth-client";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { spokenRegions } from "@/test-setup/spoken-regions/spoken-regions";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ResetPasswordForm } from "./reset-password-form";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { resetPassword: vi.fn() },
}));

const resetPassword = vi.mocked(authClient.resetPassword);
const router = { replace: vi.fn(), push: vi.fn(), refresh: vi.fn() };

beforeEach(() => {
  resetPassword.mockReset();
  resetPassword.mockResolvedValue({ data: { status: true }, error: null } as never);
  router.replace.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

describe("ResetPasswordForm", () => {
  test("WHEN a valid new password is saved THEN it replaces the old one and sign-in says so", async () => {
    renderInLocale(<ResetPasswordForm token="reset-token" />);
    await userEvent.type(screen.getByLabelText("New password"), "brand-new-password");

    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(resetPassword).toHaveBeenCalledWith(
      { newPassword: "brand-new-password", token: "reset-token" },
      { headers: { "x-app-locale": "en" } },
    );
    expect(router.replace).toHaveBeenCalledWith("/sign-in?reset=done");
  });

  test("WHEN the password is too short THEN nothing is sent", async () => {
    renderInLocale(<ResetPasswordForm token="reset-token" />);
    await userEvent.type(screen.getByLabelText("New password"), "short");

    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(resetPassword).not.toHaveBeenCalled();
  });

  test("WHEN the link has no token THEN the invalid-link state offers a new email", () => {
    renderInLocale(<ResetPasswordForm token={undefined} />);

    expect(screen.getByRole("heading", { name: "This link no longer works" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send me a new link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  test("WHEN the server refuses the token THEN the invalid-link state replaces the form", async () => {
    resetPassword.mockResolvedValue({
      data: null,
      error: { code: "INVALID_TOKEN", status: 400 },
    } as never);
    renderInLocale(<ResetPasswordForm token="used-token" />);
    await userEvent.type(screen.getByLabelText("New password"), "brand-new-password");

    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(
      await screen.findByRole("heading", { name: "This link no longer works" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  test("WHEN the page opens THEN no challenge is asked: the emailed token already proves the address", () => {
    renderInLocale(<ResetPasswordForm token="reset-token" />);

    expect(screen.getByRole("button", { name: "Save new password" })).toBeEnabled();
  });

  test("WHEN the request is in flight THEN the form is covered rather than replaced", async () => {
    resetPassword.mockReturnValue(new Promise(() => {}) as never);
    renderInLocale(<ResetPasswordForm token="reset-token" />);
    await userEvent.type(screen.getByLabelText("New password"), "brand-new-password");

    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(screen.getByLabelText("New password")).toHaveValue("brand-new-password");
    expect(screen.getByTestId("account-wait-beam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(spokenRegions()).toEqual(["Saving your new password…"]);
  });

  test("WHEN the request is refused THEN the form comes back holding what was typed", async () => {
    resetPassword.mockResolvedValue({
      data: null,
      error: { code: "UNKNOWN", status: 500 },
    } as never);
    renderInLocale(<ResetPasswordForm token="reset-token" />);
    await userEvent.type(screen.getByLabelText("New password"), "brand-new-password");

    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveValue("brand-new-password");
    expect(screen.queryByTestId("account-wait-beam")).not.toBeInTheDocument();
  });
});
