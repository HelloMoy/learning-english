import { faker } from "@faker-js/faker";
import { test as anonymous, expect, type Locator, type Page } from "@playwright/test";

import {
  aLearnerAccount,
  registerVerifiedLearner,
  test as signedIn,
  signInAs,
} from "./learner-account-fixture";
import { seedLearnerProfile } from "./learner-profile-fixture";
import { authLinkMailedTo } from "./mailpit-inbox";

/**
 * Covers the `learner-account` capability end to end: the session gate, the
 * email flows through the real Mailpit inbox, signing out and the Google
 * hand-off.
 */

/** Waits until the Turnstile test widget has handed the form its token. */
async function submitWhenChallengePasses(page: Page, name: string): Promise<void> {
  const submit = page.getByRole("button", { name });
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await submit.click();
}

/**
 * Types into an account field, once React is listening.
 *
 * Account pages are server-rendered and hydrate a moment later. Filling a
 * controlled input before its `onChange` is attached puts the text in the DOM
 * but never in React state: the form then submits empty, fails its own
 * validation, and the field clears itself on the next render. Asserting the
 * DOM value is not enough to catch that — the DOM is exactly where the lost
 * text sits — so this waits for the hydration marker React puts on every host
 * node it has claimed, and only then types.
 */
async function enter(field: Locator, value: string): Promise<void> {
  await field.evaluate(
    (input) =>
      new Promise<void>((hydrated) => {
        const claimed = () => Object.keys(input).some((key) => key.startsWith("__reactProps$"));
        const poll = () => (claimed() ? hydrated() : requestAnimationFrame(poll));
        poll();
      }),
  );
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

anonymous.describe("without a session", () => {
  anonymous("a lesson link opens sign-in, carrying the lesson as next", async ({ page }) => {
    await page.goto("/en/courses/basic-course/modules/1-introduction");

    await expect(page).toHaveURL(
      `/en/sign-in?next=${encodeURIComponent("/courses/basic-course/modules/1-introduction")}`,
    );
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  });

  anonymous("the home stays public and offers Sign in", async ({ page }) => {
    await page.goto("/pt");

    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
  });

  anonymous(
    "signing up sends a verification email whose link signs the learner in and returns them",
    async ({ page }) => {
      const account = aLearnerAccount();
      await page.goto(`/es/sign-up?next=${encodeURIComponent("/achievements")}`);
      await enter(page.getByLabel("Tu nombre"), account.name);
      await enter(page.getByLabel("Correo"), account.email);
      await enter(page.getByLabel("Contraseña"), account.password);
      await submitWhenChallengePasses(page, "Crear cuenta");

      await expect(page.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();
      await page.goto(await authLinkMailedTo(page, account.email));

      await expect(page).toHaveURL("/es/achievements");
    },
  );

  anonymous("a forgotten password is reset through the emailed link", async ({ page, context }) => {
    const account = aLearnerAccount();
    await registerVerifiedLearner(context, account);
    const newPassword = faker.internet.password({ length: 18 });

    await page.goto("/en/forgot-password");
    await enter(page.getByLabel("Email"), account.email);
    await submitWhenChallengePasses(page, "Send reset link");
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await page.goto(await authLinkMailedTo(page, account.email));
    await expect(page).toHaveURL(/\/en\/reset-password\?token=/);
    await enter(page.getByLabel("New password"), newPassword);
    await page.getByRole("button", { name: "Save new password" }).click();

    await expect(
      page.getByRole("status").filter({ hasText: "Your password was updated" }),
    ).toHaveText("Your password was updated. Sign in with the new one.");
    await enter(page.getByLabel("Email"), account.email);
    await enter(page.getByLabel("Password"), newPassword);
    await submitWhenChallengePasses(page, "Sign in");
    await expect(page).toHaveURL("/en/learning");
  });

  anonymous("wrong credentials are refused with one message", async ({ page, context }) => {
    const account = aLearnerAccount();
    await registerVerifiedLearner(context, account);

    await page.goto("/en/sign-in");
    await enter(page.getByLabel("Email"), account.email);
    await enter(page.getByLabel("Password"), "not-the-password");
    await submitWhenChallengePasses(page, "Sign in");

    await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toHaveText(
      "The email or password is incorrect.",
    );
  });

  anonymous(
    "the wait covers the credentials request and the page still arrives",
    async ({ page, context }) => {
      const account = aLearnerAccount();
      await registerVerifiedLearner(context, account);
      // Hold the credentials back so the wait is observable — a local sign-in
      // resolves far too fast to see, which is the one thing jsdom cannot show
      await page.route("**/api/auth/sign-in/email", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        await route.continue();
      });

      await page.goto("/en/sign-in");
      await enter(page.getByLabel("Email"), account.email);
      await enter(page.getByLabel("Password"), account.password);
      await submitWhenChallengePasses(page, "Sign in");

      await expect(page.getByTestId("account-wait-beam")).toBeVisible();
      await expect(page.getByTestId("spinner-arc")).toBeVisible();
      await expect(page.getByRole("button", { name: "Signing in…" })).toBeDisabled();
      await expect(page.getByRole("status")).toHaveCount(1);
      await expect(page.getByRole("status")).toHaveText("Checking your details…");

      // The fields are still there, and out of reach: `inert` keeps them from
      // taking focus, which no jsdom test can prove
      const email = page.getByLabel("Email");
      await expect(email).toHaveValue(account.email);
      await email.focus().catch(() => {});
      await expect(email).not.toBeFocused();

      await expect(page).toHaveURL("/en/learning", { timeout: 20_000 });
    },
  );

  anonymous(
    "Continue with Google hands off to Google with this site's callback",
    async ({ page }) => {
      await page.goto("/en/sign-in");

      const googleRequest = page.waitForRequest(/accounts\.google\.com/);
      await page.getByRole("button", { name: "Continue with Google" }).click();

      const redirectUri = new URL((await googleRequest).url()).searchParams.get("redirect_uri");
      expect(redirectUri).toMatch(/\/api\/auth\/callback\/google$/);
    },
  );
});

signedIn.describe("with a session", () => {
  signedIn("signing out ends the session", async ({ page, learnerState }) => {
    await seedLearnerProfile(learnerState);
    await page.goto("/en/learning");

    await page.getByRole("button", { name: /Learner menu for/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();

    await expect(page).toHaveURL("/en");
    await page.goto("/en/learning");
    await expect(page).toHaveURL(`/en/sign-in?next=${encodeURIComponent("/learning")}`);
  });

  signedIn("an account page sends a signed-in learner on", async ({ page }) => {
    await page.goto(`/en/sign-in?next=${encodeURIComponent("/profile")}`);

    await expect(page).toHaveURL(/\/en\/(profile|start)/);
  });

  signedIn("a second browser signs in to the same account", async ({ browser, learnerAccount }) => {
    const second = await browser.newContext();
    await signInAs(second, learnerAccount);
    const page = await second.newPage();

    await page.goto("/en/learning");

    await expect(page).not.toHaveURL(/sign-in/);
    await second.close();
  });
});
