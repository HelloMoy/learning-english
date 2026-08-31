import { seedContentModules } from "@/adapters/persistence/in-memory/seed/seed-content";

import { expect, test } from "@playwright/test";

/**
 * E2E coverage for the course overview's module showcase (capabilities:
 * `cinema-course-overview`, `course-vocabulary`).
 *
 * These assertions are deliberately the ones jsdom cannot make. The
 * component tests already cover structure and accessibility against mocked
 * translations; what only a real browser can confirm is that the deck
 * artwork actually loads — a broken `BlobStore` URL renders an `<img>` that
 * jsdom is perfectly happy with and a learner sees as an empty box.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const MODULE_COUNT = seedContentModules.length;
const FIRST_MODULE = [...seedContentModules].sort((a, b) => a.sequence - b.sequence)[0]!;

function courseUrl(locale: string): string {
  return `/${locale}/courses/${COURSE_SLUG}`;
}

test.describe("Course overview module showcase", () => {
  test("WHEN the course overview is visited THEN one numbered showcase card renders per module", async ({
    page,
  }) => {
    await page.goto(courseUrl("en"));

    await expect(page.getByTestId("course-module-list")).toBeVisible();
    const ordinals = page.getByTestId("module-showcase-ordinal");
    await expect(ordinals).toHaveCount(MODULE_COUNT);

    // The ordinals must ascend — the page's whole job is to read as an index.
    const texts = await ordinals.allInnerTexts();
    const numbers = texts.map((text) => Number(text.replace(/\D+/g, "")));
    expect(numbers).toEqual(Array.from({ length: MODULE_COUNT }, (_, index) => index + 1));
  });

  test("WHEN a card's call to action is activated THEN its module overview opens", async ({
    page,
  }) => {
    await page.goto(courseUrl("en"));

    await page.getByTestId("module-showcase-cta").first().click();
    // Generous timeout: against `pnpm dev` the first hit of the module route
    // pays for compiling it, which overruns the default 5s expect timeout on
    // a cold server even though the navigation itself is immediate.
    await page.waitForURL(new RegExp(`/en/courses/${COURSE_SLUG}/modules/`), { timeout: 60_000 });
    await expect(page.getByTestId("module-overview")).toBeVisible({ timeout: 60_000 });
  });

  test("WHEN the deck renders THEN its artwork actually loads", async ({ page }) => {
    await page.goto(courseUrl("en"));

    const firstDeck = page.getByTestId("module-showcase-deck").first();
    await expect(firstDeck).toBeVisible();

    const images = firstDeck.locator("img");
    await expect(images.first()).toBeVisible();

    // `naturalWidth` is zero for an image that 404s. jsdom reports zero for
    // every image, which is why this assertion has to live in a real browser.
    const widths = await images.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLImageElement).naturalWidth),
    );
    expect(widths.length).toBeGreaterThan(0);
    for (const width of widths) expect(width).toBeGreaterThan(0);
  });

  test("WHEN a module holds more lessons than the deck shows THEN the remainder is disclosed", async ({
    page,
  }) => {
    await page.goto(courseUrl("en"));

    // Module 7 holds 31 lessons against a deck of 6, so at least one card
    // must disclose a remainder.
    await expect(page.getByTestId("module-showcase-remainder").first()).toBeVisible();
  });

  for (const locale of ["en", "es"]) {
    test(`WHEN the overview renders in ${locale} THEN no retired season or episode vocabulary appears`, async ({
      page,
    }) => {
      await page.goto(courseUrl(locale));
      await expect(page.getByTestId("course-module-list")).toBeVisible();

      const text = (await page.getByTestId("course-overview").innerText()).toLowerCase();
      for (const retired of ["season", "temporada", "episode", "episodio"]) {
        expect(text, `"${retired}" should be gone from the ${locale} overview`).not.toContain(
          retired,
        );
      }
    });
  }

  test("WHEN the first module's card renders THEN it names that module and links to it", async ({
    page,
  }) => {
    await page.goto(courseUrl("en"));

    const link = page.getByRole("link", { name: FIRST_MODULE.title }).first();
    await expect(link).toHaveAttribute(
      "href",
      `/en/courses/${COURSE_SLUG}/modules/${FIRST_MODULE.slug}`,
    );
  });
});
