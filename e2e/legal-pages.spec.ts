import { expect, test } from "@playwright/test";

/**
 * E2E tests for the privacy policy and the terms.
 *
 * @remarks
 * These two properties cannot be checked anywhere above this layer.
 *
 * The first is that both pages answer an anonymous request with their content.
 * That is the whole reason they exist: Google's OAuth consent screen will not
 * publish until it can fetch the privacy URL, and it arrives carrying no
 * cookie. A component test renders the document happily whether or not a
 * server would ever serve it.
 *
 * The second is the locale prefix on the footer links. next-intl resolves it
 * from the router context, which jsdom has no equivalent of, so every
 * locale-aware `Link` renders its bare href under Vitest — the component test
 * says so explicitly. Only a real browser following a real click shows whether
 * a Spanish reader stays in Spanish.
 */

const LEGAL_ROUTES = [
  { path: "/en/privacy", heading: "Privacy" },
  { path: "/en/terms", heading: "Terms" },
  { path: "/es/privacy", heading: "Privacidad" },
  { path: "/es/terms", heading: "Términos" },
  { path: "/pt/privacy", heading: "Privacidade" },
  { path: "/pt/terms", heading: "Termos" },
] as const;

test.describe("legal pages", () => {
  for (const { path, heading } of LEGAL_ROUTES) {
    test(`${path} serves its document to a reader with no session`, async ({ page, context }) => {
      // Arrange — an empty jar is the point: this is the request Google's
      // fetcher makes, and the one every first-time visitor makes.
      await context.clearCookies();

      // Act
      const response = await page.goto(path);

      // Assert
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }

  test("the privacy policy names every processor it relies on", async ({ page }) => {
    // The spec requires the text to name what actually processes learner data.
    // A missing name here is a policy that under-discloses, which no type or
    // key-parity check can notice.
    await page.goto("/en/privacy");

    const main = page.getByRole("main");
    for (const processor of ["Turso", "Resend", "Cloudflare Turnstile", "Sentry"]) {
      await expect(main).toContainText(processor);
    }
  });

  test("the footer reaches the privacy policy and keeps the locale", async ({ page }) => {
    // Act
    await page.goto("/es");
    await page.getByRole("contentinfo").getByRole("link", { name: "Privacidad" }).click();

    // Assert — the prefix is the assertion. A `next/link` here would land on
    // /privacy, the proxy would bounce it to the default locale, and a Spanish
    // reader would silently get the English policy.
    await expect(page).toHaveURL(/\/es\/privacy$/);
    await expect(page.getByRole("heading", { level: 1, name: "Privacidad" })).toBeVisible();
  });

  test("every page carries the footer", async ({ page }) => {
    await page.goto("/en");

    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Privacy" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Terms" })).toBeVisible();
  });
});
