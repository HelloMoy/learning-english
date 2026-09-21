import { authClient } from "@/lib/auth-client/auth-client";
import { MESSAGES, renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ChangePasswordSection } from "./change-password-section";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { changePassword: vi.fn() },
}));

const changePassword = vi.mocked(authClient.changePassword);

const copy = MESSAGES.en.Profile.password;

beforeEach(() => {
  changePassword.mockReset();
  changePassword.mockResolvedValue({ data: {}, error: null } as never);
});

const renderSection = (locale: "en" | "es" | "pt" = "en") =>
  renderInLocale(<ChangePasswordSection />, locale);

const submitChange = async ({
  current = "current-password",
  next = "a-new-password",
  label = copy,
}: { current?: string; next?: string; label?: typeof copy } = {}) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(label.currentLabel), current);
  await user.type(screen.getByLabelText(label.newLabel), next);
  await user.click(screen.getByRole("button", { name: label.submit }));
};

describe("ChangePasswordSection", () => {
  test("WHEN it renders THEN both fields carry the autocomplete a password manager expects", () => {
    renderSection();

    expect(screen.getByLabelText(copy.currentLabel)).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByLabelText(copy.newLabel)).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByText(copy.hint)).toBeInTheDocument();
  });

  test("WHEN a valid change is submitted THEN the other sessions are revoked with it", async () => {
    renderSection();

    await submitChange({ current: "old-password", next: "brand-new-password" });

    expect(changePassword).toHaveBeenCalledWith(
      {
        currentPassword: "old-password",
        newPassword: "brand-new-password",
        revokeOtherSessions: true,
      },
      { headers: { "x-app-locale": "en" } },
    );
  });

  test("WHEN the change succeeds THEN both fields are emptied and the result is announced", async () => {
    renderSection();

    await submitChange();

    expect(await screen.findByRole("status")).toHaveTextContent(copy.changed);
    expect(screen.getByLabelText(copy.currentLabel)).toHaveValue("");
    expect(screen.getByLabelText(copy.newLabel)).toHaveValue("");
  });

  test("WHEN the current password is wrong THEN the refusal is an alert and the fields keep their values", async () => {
    changePassword.mockResolvedValue({
      data: null,
      error: { code: "INVALID_PASSWORD", status: 400 },
    } as never);
    renderSection();

    await submitChange({ current: "wrong-password", next: "brand-new-password" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      MESSAGES.en.Account.errors.invalidPassword,
    );
    expect(screen.getByLabelText(copy.currentLabel)).toHaveValue("wrong-password");
    expect(screen.getByLabelText(copy.newLabel)).toHaveValue("brand-new-password");
  });

  test("WHEN the new password is too short THEN nothing is sent and the field says why", async () => {
    renderSection();

    await submitChange({ next: "1234567" });

    expect(changePassword).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      MESSAGES.en.Account.validation.passwordLength,
    );
  });

  test("WHEN it renders in Spanish THEN every string comes from the Spanish catalogue", () => {
    renderSection("es");

    const spanish = MESSAGES.es.Profile.password;
    expect(screen.getByRole("heading", { name: spanish.heading })).toBeInTheDocument();
    expect(screen.getByText(spanish.description)).toBeInTheDocument();
    expect(screen.getByLabelText(spanish.currentLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: spanish.submit })).toBeInTheDocument();
  });
});
