import type { Locator, Page } from "@playwright/test";

import { expect, ONBOARDED_LEARNER, test } from "./learner-profile-fixture";

/**
 * Covers the `profile-page` capability's layout, which only a browser can
 * show: where the save bar sits at each width, and that the card stays in
 * view beside the sections on a wide screen.
 */

const WIDE = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

async function editTheName(page: Page): Promise<Locator> {
  await page.goto("/en/profile");
  await page.getByRole("textbox", { name: "Name" }).fill(`${ONBOARDED_LEARNER.name} Jr`);
  const bar = page.getByTestId("profile-save-bar");
  await expect(bar).toBeVisible();
  return bar;
}

const positionOf = (element: Locator) =>
  element.evaluate((node) => getComputedStyle(node).position);

test.describe("Profile layout", () => {
  test("on a wide screen the save bar sits in the card column, not docked to the viewport", async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);

    const bar = await editTheName(page);

    await expect(
      page.getByTestId("profile-card-column").getByTestId("profile-save-bar"),
    ).toBeVisible();
    expect(await positionOf(bar)).not.toBe("fixed");
  });

  test("on a wide screen the card stays in view while the avatar picker is reached", async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    await page.goto("/en/profile");

    await page.getByRole("heading", { level: 2, name: "Preferences" }).scrollIntoViewIfNeeded();

    await expect(page.getByTestId("learner-card")).toBeInViewport();
  });

  test("the prizes count under the card leads to the achievements", async ({ page }) => {
    await page.goto("/en/profile");

    await page.getByTestId("prizes-claimed").click();

    await expect(page).toHaveURL("/en/achievements");
  });

  test("on a phone the save bar is docked to the bottom of the viewport", async ({ page }) => {
    await page.setViewportSize(PHONE);

    const bar = await editTheName(page);

    expect(await positionOf(bar)).toBe("fixed");
    const box = await bar.boundingBox();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(PHONE.height);
  });
});
