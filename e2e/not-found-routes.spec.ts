import { expect, test } from "@playwright/test";

/**
 * E2E tests for unknown routes.
 *
 * @remarks
 * These assertions exist because the defects they cover are invisible to the
 * layers above. A component test can render the not-found page, but only a
 * server can show which page a given URL actually reaches — and the routing
 * that decides it lives in `src/proxy.ts`, in Next's segment matching, and in
 * `notFound()` boundary resolution, none of which jsdom runs.
 *
 * The `/manifest.json` case is the sharper one: it used to answer a correct
 * 404 while writing `⨯ Error: shareMetadata received an unsupported locale`
 * to the server log on every request. A status-code assertion passed
 * throughout. What follows pins the routing; the log itself is checked by
 * hand against `pnpm start`, as the change's tasks record.
 */

test.describe("unknown routes", () => {
  test("a dotted path that is not a static file is a clean 404", async ({ page }) => {
    // Excluded from the proxy matcher along with every other dotted path, so
    // it reaches the router with `manifest.json` as its locale segment.
    const response = await page.goto("/manifest.json");

    expect(response?.status()).toBe(404);
  });

  test("the real web app manifest still resolves", async ({ page }) => {
    // The counterpart to the test above: the guard must not turn away the
    // route the application actually advertises.
    const response = await page.goto("/manifest.webmanifest");

    expect(response?.status()).toBe(200);
  });

  test("an unknown path under a supported locale says the page is missing", async ({ page }) => {
    const response = await page.goto("/es/error");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /página no encontrada/i })).toBeVisible();
    // Scoped to the page's own landmark: `role="alert"` alone also matches
    // Next's route announcer, which is present on every page.
    await expect(page.getByRole("main")).not.toContainText(/no soportado/i);
  });

  test("an unrecognized first segment is a missing page, not a missing language", async ({
    page,
  }) => {
    // The proxy rewrites `/xx` to `/en/xx`, so this is a path problem by the
    // time the application sees it — which is why the old "Locale not
    // supported" copy was wrong in every case it was shown.
    const response = await page.goto("/xx");

    expect(page.url()).toContain("/en/xx");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
  });

  test("the home link keeps the learner in their own locale", async ({ page }) => {
    await page.goto("/pt/does-not-exist");

    await page.getByRole("link", { name: /ir para o início/i }).click();

    await expect(page).toHaveURL(/\/pt$/);
  });
});
