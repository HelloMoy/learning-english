import { expect, type Page } from "@playwright/test";

import { attemptSignIn, signInAs, test } from "./learner-account-fixture";
import { ONBOARDED_LEARNER, seedLearnerProfile } from "./learner-profile-fixture";
import { authLinkMailedTo } from "./mailpit-inbox";

/**
 * Covers the `account-deletion` capability end to end: the Profile dialog,
 * the confirmation email through the real Mailpit inbox, and the link that
 * only deletes inside the account's own session.
 */

const DELETE_LINK = "/delete-user/callback";

async function requestDeletionFromProfile(page: Page): Promise<void> {
  await page.goto("/en/profile");
  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Send confirmation email" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "We sent a confirmation link" }),
  ).toBeVisible();
}

test.describe("Account deletion", () => {
  test("the emailed link, opened while signed in, deletes the account and signs the learner out", async ({
    page,
    learnerState,
    learnerAccount,
  }) => {
    await seedLearnerProfile(learnerState);
    await requestDeletionFromProfile(page);

    await page.goto(await authLinkMailedTo(page, learnerAccount.email, DELETE_LINK));

    await expect(page).toHaveURL("/en/account-deleted");
    await expect(
      page.getByRole("heading", { level: 1, name: "Your account was deleted" }),
    ).toBeVisible();
    await page.goto("/en/learning");
    await expect(page).toHaveURL(/\/en\/sign-in/);
    expect((await attemptSignIn(page.context(), learnerAccount)).status()).toBe(401);
  });

  test("the emailed link, opened without the account's session, deletes nothing", async ({
    page,
    browser,
    learnerState,
    learnerAccount,
  }) => {
    await seedLearnerProfile(learnerState);
    await requestDeletionFromProfile(page);
    const link = await authLinkMailedTo(page, learnerAccount.email, DELETE_LINK);
    const elsewhere = await browser.newContext();

    await (await elsewhere.newPage()).goto(link);

    await elsewhere.close();
    const later = await browser.newContext();
    await signInAs(later, learnerAccount);
    const laterPage = await later.newPage();
    await laterPage.goto("/en/profile");
    // The Profile page is titled with the learner, so its heading is the proof
    // that the account — and its card — outlived the link.
    await expect(laterPage.getByRole("heading", { level: 1 })).toHaveText(ONBOARDED_LEARNER.name);
    await later.close();
  });
});
