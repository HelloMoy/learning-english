import { faker } from "@faker-js/faker";
import { test as anonymous, expect, type Page } from "@playwright/test";

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
      await page.getByLabel("Tu nombre").fill(account.name);
      await page.getByLabel("Correo").fill(account.email);
      await page.getByLabel("Contraseña").fill(account.password);
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
    await page.getByLabel("Email").fill(account.email);
    await submitWhenChallengePasses(page, "Send reset link");
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await page.goto(await authLinkMailedTo(page, account.email));
    await expect(page).toHaveURL(/\/en\/reset-password\?token=/);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByRole("button", { name: "Save new password" }).click();

    await expect(page.getByRole("status")).toHaveText(
      "Your password was updated. Sign in with the new one.",
    );
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password").fill(newPassword);
    await submitWhenChallengePasses(page, "Sign in");
    await expect(page).toHaveURL("/en/learning");
  });

  anonymous("wrong credentials are refused with one message", async ({ page, context }) => {
    const account = aLearnerAccount();
    await registerVerifiedLearner(context, account);

    await page.goto("/en/sign-in");
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password").fill("not-the-password");
    await submitWhenChallengePasses(page, "Sign in");

    await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toHaveText(
      "The email or password is incorrect.",
    );
  });

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
