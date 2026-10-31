import { expect, test, type Page } from "@playwright/test";

/**
 * E2E test for the `product-analytics` capability's "Usage data is sent only
 * when a project token is configured".
 *
 * @remarks
 * The build under test carries no PostHog token — CI's never does — and that
 * is exactly the scenario guarded here: such a build must not ask for consent,
 * and must not send a single request to PostHog or to the relay in front of
 * it. Only a browser sees the network, so no layer above this one can check
 * it.
 *
 * What a build *with* a token does (the banner, the cookie's scope, what a
 * recording leaves out) cannot run here for the same reason, and is verified
 * by hand on the `develop` preview; the options that produce it are held by
 * unit tests.
 */

const ANALYTICS_REQUEST = /posthog\.com|\/pulse\//;

const PUBLIC_PAGES = ["/en", "/es/sign-in", "/en/privacy", "/pt/courses"];

/**
 * Gives a client that starts after hydration its chance to speak. The
 * assertions that follow are about something *not* happening, so there is no
 * event to wait for — only a bounded silence. `networkidle` is not it: the
 * sign-in page's bot check keeps the network busy for as long as it likes.
 */
async function quietPeriod(page: Page): Promise<void> {
  await page.getByRole("contentinfo").waitFor();
  await page.waitForTimeout(1_500);
}

test.describe("a build without a PostHog token", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} sends nothing to PostHog and asks for no consent`, async ({ page }) => {
      // Arrange
      const analyticsRequests: string[] = [];
      page.on("request", (request) => {
        if (ANALYTICS_REQUEST.test(request.url())) analyticsRequests.push(request.url());
      });

      // Act
      await page.goto(path);
      await quietPeriod(page);

      // Assert
      expect(analyticsRequests).toEqual([]);
      await expect(page.getByRole("region", { name: /priva[cd]/i })).toHaveCount(0);
      await expect(page.getByRole("contentinfo").getByRole("button")).toHaveCount(0);
    });
  }

  test("no PostHog cookie or storage entry exists after browsing", async ({ page, context }) => {
    // Act
    await page.goto("/en");
    await quietPeriod(page);
    await page.goto("/en/privacy");
    await quietPeriod(page);

    // Assert
    const cookieNames = (await context.cookies()).map((cookie) => cookie.name);
    expect(cookieNames.filter((name) => name.startsWith("ph_"))).toEqual([]);
    const storageKeys = await page.evaluate(() => [
      ...Object.keys(window.localStorage),
      ...Object.keys(window.sessionStorage),
    ]);
    expect(storageKeys.filter((key) => /^(ph_|__ph)/.test(key))).toEqual([]);
  });
});
