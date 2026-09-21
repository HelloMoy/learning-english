import { faker } from "@faker-js/faker";
import type { BrowserContext, Page } from "@playwright/test";

import {
  aLearnerAccount,
  attemptSignIn,
  expect,
  registerVerifiedLearner,
  signInAs,
  test,
} from "./learner-account-fixture";
import { seedLearnerProfile } from "./learner-profile-fixture";
import {
  authLinkMailedTo,
  messagesMailedTo,
  newestMessageTo,
  nextAuthLinkMailedTo,
} from "./mailpit-inbox";

/**
 * Covers the `learner-account` capability's two account-security flows end to
 * end: changing the password from a signed-in session, and moving the account
 * to another address through the approval-then-verification pair of emails,
 * read from the real Mailpit inbox.
 */

const VERIFY_LINK = "/verify-email";

/**
 * Next's route announcer is a `role="alert"` of its own, so a bare role query
 * matches two elements on any page. Every assertion below scopes to the form
 * it is about.
 */
const passwordForm = (page: Page) =>
  page.locator('form[aria-labelledby="change-password-heading"]');
const emailSection = (page: Page) => page.locator('[aria-labelledby="change-email-heading"]');

/** Whether the browser's cookie still resolves to a live session. */
async function sessionOf(context: BrowserContext): Promise<unknown> {
  return (await context.request.get("/api/auth/get-session")).json();
}

test.describe("Account identity", () => {
  test("changing the password signs the other devices out and leaves the old one useless", async ({
    page,
    browser,
    learnerState,
    learnerAccount,
  }) => {
    await seedLearnerProfile(learnerState);
    const otherDevice = await browser.newContext();
    await signInAs(otherDevice, learnerAccount);
    const newPassword = `${learnerAccount.password}-next`;

    await page.goto("/en/profile");
    await page.getByLabel("Current password").fill(learnerAccount.password);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(passwordForm(page).getByRole("status")).toContainText("Password changed");
    // The session itself, not the page it opens: whether a revoked cookie is
    // turned away at the route belongs to `learner-account`'s route guard.
    expect(await sessionOf(otherDevice)).toBeNull();
    await otherDevice.close();

    const elsewhere = await browser.newContext();
    expect((await attemptSignIn(elsewhere, learnerAccount)).status()).toBe(401);
    expect(
      (await attemptSignIn(elsewhere, { ...learnerAccount, password: newPassword })).status(),
    ).toBe(200);
    await elsewhere.close();
  });

  test("changing the password leaves a notice in the learner's own language", async ({
    page,
    learnerState,
    learnerAccount,
  }) => {
    await seedLearnerProfile(learnerState);
    const before = await messagesMailedTo(page, learnerAccount.email);

    await page.goto("/es/profile");
    await page.getByLabel("Contraseña actual").fill(learnerAccount.password);
    await page.getByLabel("Contraseña nueva").fill(`${learnerAccount.password}-next`);
    await page.getByRole("button", { name: "Cambiar contraseña" }).click();

    await expect(passwordForm(page).getByRole("status")).toBeVisible();
    await expect.poll(() => messagesMailedTo(page, learnerAccount.email)).toBe(before + 1);
    const notice = await newestMessageTo(page, learnerAccount.email);
    expect(notice.subject).toBe("Tu contraseña de English Course ha cambiado");
    // The notice offers the recovery page, never a key to the account.
    expect(notice.text).toContain("/es/forgot-password");
    expect(notice.text).not.toContain("token=");
  });

  test("a wrong current password is refused without changing anything", async ({
    page,
    browser,
    learnerState,
    learnerAccount,
  }) => {
    await seedLearnerProfile(learnerState);

    await page.goto("/en/profile");
    await page.getByLabel("Current password").fill("not-the-password");
    await page.getByLabel("New password").fill("a-brand-new-password");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(passwordForm(page).getByRole("alert")).toContainText(
      "That is not your current password",
    );
    const elsewhere = await browser.newContext();
    expect((await attemptSignIn(elsewhere, learnerAccount)).status()).toBe(200);
    await elsewhere.close();
  });

  test("the address moves only after the link on the old address and the one on the new", async ({
    page,
    browser,
    learnerState,
    learnerAccount,
  }) => {
    await seedLearnerProfile(learnerState);
    const newEmail = `e2e-${faker.string.uuid()}@example.com`;
    const signUpLink = await authLinkMailedTo(page, learnerAccount.email, VERIFY_LINK);

    await page.goto("/es/profile");
    await page.getByLabel("Correo nuevo").fill(newEmail);
    await page.getByRole("button", { name: "Cambiar correo" }).click();

    // The link goes where the learner can already read it, not to the address
    // they are only claiming.
    await expect(emailSection(page).getByRole("status")).toContainText(learnerAccount.email);
    await page.goto(await nextAuthLinkMailedTo(page, learnerAccount.email, signUpLink));

    await page.goto(await authLinkMailedTo(page, newEmail, VERIFY_LINK));

    await expect(page).toHaveURL("/es/profile");
    // Exact, because the address also appears inside the form's "we send a
    // link to …" line once it is the one on file.
    await expect(page.getByText(newEmail, { exact: true })).toBeVisible();
    const elsewhere = await browser.newContext();
    expect((await attemptSignIn(elsewhere, learnerAccount)).status()).toBe(401);
    expect((await attemptSignIn(elsewhere, { ...learnerAccount, email: newEmail })).status()).toBe(
      200,
    );
    await elsewhere.close();
  });

  test("asking for an address that belongs to someone else answers the same and mails them nothing", async ({
    page,
    browser,
    learnerState,
    learnerAccount,
  }) => {
    await seedLearnerProfile(learnerState);
    const someoneElse = aLearnerAccount();
    const theirBrowser = await browser.newContext();
    await registerVerifiedLearner(theirBrowser, someoneElse);
    await theirBrowser.close();
    const before = await messagesMailedTo(page, someoneElse.email);

    await page.goto("/en/profile");
    await page.getByLabel("New email address").fill(someoneElse.email);
    await page.getByRole("button", { name: "Change email" }).click();

    await expect(emailSection(page).getByRole("status")).toContainText(learnerAccount.email);
    expect(await messagesMailedTo(page, someoneElse.email)).toBe(before);
  });
});
