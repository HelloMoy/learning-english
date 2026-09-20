import { redirectSignedInLearner } from "@/lib/auth/redirect-signed-in-learner/redirect-signed-in-learner";
import { MESSAGES, renderInLocale } from "@/test-setup/render-in-locale";

import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import AccountDeletedPage, { generateMetadata as deletedMetadata } from "./account-deleted/page";
import ForgotPasswordPage, { generateMetadata as forgotMetadata } from "./forgot-password/page";
import ResetPasswordPage, { generateMetadata as resetMetadata } from "./reset-password/page";
import SignInPage, { generateMetadata as signInMetadata } from "./sign-in/page";
import SignUpPage, { generateMetadata as signUpMetadata } from "./sign-up/page";

vi.mock("@/lib/auth/redirect-signed-in-learner/redirect-signed-in-learner", () => ({
  redirectSignedInLearner: vi.fn(),
}));
vi.mock(
  "@/components/turnstile-challenge/turnstile-challenge",
  () => import("@/test-setup/stubs/turnstile-challenge"),
);
vi.mock("@/lib/auth-client/auth-client", () => ({ authClient: {} }));
vi.mock("next-intl/server", () => import("@/test-setup/stubs/next-intl-server"));

/**
 * Guards the account pages' contract: kept out of search, closed to a learner
 * who is already signed in, and carrying a validated `next`.
 */

const params = (locale = "en") => Promise.resolve({ locale });
const search = (query: Record<string, string> = {}) => Promise.resolve(query);

beforeEach(() => {
  vi.mocked(redirectSignedInLearner).mockClear();
});

describe.each([
  ["sign-in", signInMetadata, "Sign in"],
  ["sign-up", signUpMetadata, "Create your account"],
  ["forgot-password", forgotMetadata, "Reset your password"],
  ["reset-password", resetMetadata, "Choose a new password"],
  ["account-deleted", deletedMetadata, "Account deleted"],
])("the %s page's metadata", (_, generateMetadata, title) => {
  test("asks search engines not to index it, and names the page", async () => {
    const metadata = await generateMetadata({ params: params() });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.title).toBe(title);
  });
});

describe("the sign-in page", () => {
  test("sends a signed-in learner on to the validated next", async () => {
    await SignInPage({ params: params("es"), searchParams: search({ next: "/achievements" }) });

    expect(redirectSignedInLearner).toHaveBeenCalledWith("es", "/achievements");
  });

  test("ignores an unsafe next", async () => {
    await SignInPage({ params: params(), searchParams: search({ next: "https://evil.example" }) });

    expect(redirectSignedInLearner).toHaveBeenCalledWith("en", "/learning");
  });

  test("confirms a password reset when arriving from one", async () => {
    renderInLocale(await SignInPage({ params: params(), searchParams: search({ reset: "done" }) }));

    expect(screen.getByRole("status")).toHaveTextContent("Your password was updated.");
  });

  test("links to sign-up, carrying next", async () => {
    renderInLocale(
      await SignInPage({ params: params(), searchParams: search({ next: "/courses/basics" }) }),
    );

    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      `/sign-up?next=${encodeURIComponent("/courses/basics")}`,
    );
  });
});

describe("the other account pages", () => {
  test.each([
    ["sign-up", SignUpPage, "Create your account"],
    ["forgot-password", ForgotPasswordPage, "Forgot your password?"],
    ["reset-password", ResetPasswordPage, "Choose a new password"],
  ])(
    "the %s page closes to a signed-in learner and renders its heading",
    async (_, Page, heading) => {
      renderInLocale(await Page({ params: params(), searchParams: search({ token: "t" }) }));

      expect(redirectSignedInLearner).toHaveBeenCalledWith("en", "/learning");
      expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    },
  );
});

describe("the account-deleted page", () => {
  const PENDING_PRIZE_KEY = "learning-english:prize-announce";

  test("confirms the deletion in the learner's language and links home", async () => {
    renderInLocale(await AccountDeletedPage({ params: params("es") }), "es");

    const copy = MESSAGES.es.Account.accountDeleted;
    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.subtitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.homeLink })).toHaveAttribute("href", "/");
  });

  test("is open to a signed-out visitor", async () => {
    await AccountDeletedPage({ params: params() });

    expect(redirectSignedInLearner).not.toHaveBeenCalled();
  });

  test("forgets a prize announcement the deleted account left waiting", async () => {
    window.localStorage.setItem(PENDING_PRIZE_KEY, "vowels");

    renderInLocale(await AccountDeletedPage({ params: params() }));

    await waitFor(() => expect(window.localStorage.getItem(PENDING_PRIZE_KEY)).toBeNull());
  });
});
