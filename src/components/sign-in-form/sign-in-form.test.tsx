import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client/auth-client";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { localizeGetPathname } from "@/test-setup/stubs/localized-pathname";
import { PASSED_CHALLENGE_TOKEN } from "@/test-setup/stubs/turnstile-challenge";

import { faker } from "@faker-js/faker";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SignInForm } from "./sign-in-form";

vi.mock("@/lib/auth-client/auth-client", () => ({
  authClient: { signIn: { email: vi.fn(), social: vi.fn() } },
}));
vi.mock(
  "@/components/turnstile-challenge/turnstile-challenge",
  () => import("@/test-setup/stubs/turnstile-challenge"),
);

const signIn = vi.mocked(authClient.signIn.email);
const router = { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() };

beforeEach(() => {
  signIn.mockReset();
  signIn.mockResolvedValue({ data: {}, error: null } as never);
  router.replace.mockClear();
  router.refresh.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
  localizeGetPathname();
});

async function signInWith(email: string, password: string, submitName = "Sign in") {
  await userEvent.type(screen.getByLabelText(/^(Email|Correo)$/), email);
  await userEvent.type(screen.getByLabelText(/^(Password|Contraseña)$/), password);
  await userEvent.click(screen.getByRole("button", { name: "pass challenge" }));
  await userEvent.click(screen.getByRole("button", { name: submitName }));
}

describe("SignInForm", () => {
  test("WHEN the challenge has not passed THEN the form cannot be submitted", () => {
    renderInLocale(<SignInForm returnPath="/learning" />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  test("WHEN the credentials are accepted THEN the learner is sent to the return path with a fresh render", async () => {
    const email = faker.internet.email();
    renderInLocale(<SignInForm returnPath="/courses/basics" />, "es");

    await signInWith(email, "long-enough-1", "Iniciar sesión");

    expect(signIn).toHaveBeenCalledWith(
      { email, password: "long-enough-1", callbackURL: "/es/courses/basics" },
      { headers: { "x-captcha-response": PASSED_CHALLENGE_TOKEN, "x-app-locale": "es" } },
    );
    expect(router.replace).toHaveBeenCalledWith("/courses/basics");
    expect(router.refresh).toHaveBeenCalled();
  });

  test("WHEN the credentials are wrong THEN one message says so without naming which part", async () => {
    signIn.mockResolvedValue({
      data: null,
      error: { code: "INVALID_EMAIL_OR_PASSWORD", status: 401 },
    } as never);
    renderInLocale(<SignInForm returnPath="/learning" />);

    await signInWith(faker.internet.email(), "long-enough-1");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The email or password is incorrect.",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  test("WHEN the address is not verified yet THEN the learner is told to open the link first", async () => {
    signIn.mockResolvedValue({
      data: null,
      error: { code: "EMAIL_NOT_VERIFIED", status: 403 },
    } as never);
    renderInLocale(<SignInForm returnPath="/learning" />);

    await signInWith(faker.internet.email(), "long-enough-1");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Confirm your email first: open the link we sent you, then sign in.",
    );
  });

  test("WHEN arriving from a password reset THEN a confirmation is shown", () => {
    renderInLocale(
      <SignInForm
        returnPath="/learning"
        passwordUpdated
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Your password was updated. Sign in with the new one.",
    );
  });

  test("WHEN it renders THEN it links to the forgot-password page and offers Google", () => {
    renderInLocale(<SignInForm returnPath="/learning" />);

    expect(screen.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });
});
