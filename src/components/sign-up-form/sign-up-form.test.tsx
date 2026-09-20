import { authClient } from "@/lib/auth-client/auth-client";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";
import { PASSED_CHALLENGE_TOKEN } from "@/test-setup/stubs/turnstile-challenge";

import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { signUp: { email: vi.fn() }, signIn: { social: vi.fn() } },
}));
vi.mock(
  "@/components/turnstile-challenge/turnstile-challenge",
  () => import("@/test-setup/stubs/turnstile-challenge"),
);

const signUp = vi.mocked(authClient.signUp.email);

beforeEach(() => {
  signUp.mockReset();
  signUp.mockResolvedValue({ data: {}, error: null } as never);
  localizeGetPathname();
});

async function fillIn({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  await userEvent.type(screen.getByLabelText("Your name"), name);
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

describe("SignUpForm", () => {
  test("WHEN the challenge has not passed THEN the form cannot be submitted", () => {
    renderInLocale(<SignUpForm returnPath="/learning" />);

    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
  });

  test("WHEN the password is too short THEN the length error shows and nothing is sent", async () => {
    renderInLocale(<SignUpForm returnPath="/learning" />);
    await fillIn({ name: "Ana", email: faker.internet.email(), password: "1234567" });
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Between 8 and 128 characters. Use between 8 and 128 characters.",
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  test("WHEN the form is valid THEN the account is requested with the token and a localized return", async () => {
    const values = { name: "Ana García", email: faker.internet.email(), password: "long-enough-1" };
    renderInLocale(<SignUpForm returnPath="/courses/basics" />, "es");
    await userEvent.type(screen.getByLabelText("Tu nombre"), values.name);
    await userEvent.type(screen.getByLabelText("Correo"), values.email);
    await userEvent.type(screen.getByLabelText("Contraseña"), values.password);
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(signUp).toHaveBeenCalledWith(
      { ...values, callbackURL: "/es/courses/basics" },
      { headers: { "x-captcha-response": PASSED_CHALLENGE_TOKEN } },
    );
  });

  test("WHEN the account is requested THEN the form gives way to a check-your-inbox message naming the address", async () => {
    const email = faker.internet.email();
    renderInLocale(<SignUpForm returnPath="/learning" />);
    await fillIn({ name: "Ana", email, password: "long-enough-1" });
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(email);
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  test("WHEN the server refuses THEN a localized error is announced", async () => {
    signUp.mockResolvedValue({ data: null, error: { status: 429 } } as never);
    renderInLocale(<SignUpForm returnPath="/learning" />);
    await fillIn({ name: "Ana", email: faker.internet.email(), password: "long-enough-1" });
    await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts. Wait a minute and try again.",
    );
  });

  test("WHEN it renders THEN Google is offered as the other way in", () => {
    renderInLocale(<SignUpForm returnPath="/learning" />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });
});
