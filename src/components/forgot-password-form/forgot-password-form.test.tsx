import { authClient } from "@/lib/auth-client/auth-client";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { spokenRegions } from "@/test-setup/spoken-regions/spoken-regions";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";
import { PASSED_CHALLENGE_TOKEN } from "@/test-setup/stubs/turnstile-challenge";

import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot-password-form";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { requestPasswordReset: vi.fn() },
}));
vi.mock(
  "@/components/turnstile-challenge/turnstile-challenge",
  () => import("@/test-setup/stubs/turnstile-challenge"),
);

const requestReset = vi.mocked(authClient.requestPasswordReset);

beforeEach(() => {
  requestReset.mockReset();
  requestReset.mockResolvedValue({ data: { status: true }, error: null } as never);
  localizeGetPathname();
});

describe("ForgotPasswordForm", () => {
  test("WHEN an address is sent THEN a reset link is requested back to this locale's reset page", async () => {
    const email = faker.internet.email();
    renderInLocale(<ForgotPasswordForm />, "es");
    await userEvent.type(screen.getByLabelText("Correo"), email);
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(requestReset).toHaveBeenCalledWith(
      { email, redirectTo: "/es/reset-password" },
      { headers: { "x-captcha-response": PASSED_CHALLENGE_TOKEN, "x-app-locale": "es" } },
    );
  });

  test("WHEN the request is accepted THEN the same confirmation shows whatever the address", async () => {
    const email = faker.internet.email();
    renderInLocale(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), email);
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      `If an account exists for ${email}, we sent it a link to reset the password.`,
    );
  });

  test("WHEN the address is malformed THEN nothing is requested", async () => {
    renderInLocale(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), "ana@");
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(requestReset).not.toHaveBeenCalled();
  });

  test("WHEN the request is in flight THEN the form is covered rather than replaced", async () => {
    requestReset.mockReturnValue(new Promise(() => {}) as never);
    const email = faker.internet.email();
    renderInLocale(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), email);
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByLabelText("Email")).toHaveValue(email);
    expect(screen.getByTestId("account-wait-beam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    expect(spokenRegions()).toEqual(["Preparing your reset link…"]);
  });

  test("WHEN the request is refused THEN the form comes back holding what was typed", async () => {
    requestReset.mockResolvedValue({
      data: null,
      error: { code: "UNKNOWN", status: 500 },
    } as never);
    const email = faker.internet.email();
    renderInLocale(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email"), email);
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue(email);
    expect(screen.queryByTestId("account-wait-beam")).not.toBeInTheDocument();
  });
});
