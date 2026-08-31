import {
  seedContentLessonRows,
  seedContentModules,
} from "@/adapters/persistence/in-memory/seed/seed-content";

import { expect, Page, test } from "@playwright/test";

/**
 * E2E coverage for the `responsive-viewport-fit` capability, plus the
 * narrow-viewport requirements added to `cinema-home` and
 * `cinema-module-overview`.
 *
 * This is the layer that actually proves the change: jsdom has no layout
 * engine, so "does the page fit the viewport" cannot be asserted anywhere else.
 *
 * Viewports are set with `test.use({ viewport })` per describe block rather
 * than by adding a Playwright project — a mobile project would multiply every
 * existing spec across a fourth device for no benefit. These run under all
 * three configured browser projects as they are.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const FIRST_MODULE = seedContentModules[0]!;
const FIRST_LESSON = seedContentLessonRows.find((lesson) => lesson.moduleId === FIRST_MODULE.id)!;

/** The largest module: 16 rows whose titles all begin "Exercise N Pronunciation Step By Step Lesson". */
const SHARED_PREFIX_MODULE = seedContentModules.find(
  (module) => module.slug === "10-the-practice-zone-sharpen-your-skills",
)!;

const LOCALES = ["en", "es", "pt"] as const;

const PHONE_WIDTHS = [
  { name: "320px (smallest supported)", width: 320, height: 720 },
  { name: "390px (iPhone-class)", width: 390, height: 844 },
] as const;

/** Every route the app serves, relative to a locale prefix. */
const routesFor = (locale: string) => [
  { name: "home", path: `/${locale}` },
  { name: "course overview", path: `/${locale}/courses/${COURSE_SLUG}` },
  {
    name: "module overview",
    path: `/${locale}/courses/${COURSE_SLUG}/modules/${FIRST_MODULE.slug}`,
  },
  {
    name: "lesson page",
    path: `/${locale}/courses/${COURSE_SLUG}/modules/${FIRST_MODULE.slug}/lessons/${FIRST_LESSON.id}`,
  },
  { name: "not found", path: `/${locale}/no-such-page` },
];

/**
 * Routes whose fit is re-checked in the non-default locales.
 *
 * The full route × locale cross product is mostly redundant: translated text
 * reaches the layout through the shared header, which is the same component on
 * every route, and through page copy, which is prose that wraps. Re-testing all
 * five routes in all three locales re-measures one header fifteen times, and
 * the cost is real — this suite runs against `next dev`, and the extra load is
 * what tips the course overview into the stalls described on `gotoRendered`.
 *
 * So: every route is swept in `en` for structural coverage, and these two are
 * swept in `es`/`pt` as well — the home, whose hero copy is the longest
 * translated block in the app, and the module overview, whose rows pair
 * translated chrome with real lesson titles.
 */
const LOCALE_SENSITIVE_ROUTES = new Set(["home", "module overview"]);

/**
 * The document's own horizontal overflow. A view may still scroll a bounded
 * region of its own sideways; what must never happen is the *document*
 * scrolling, which is what this measures.
 */
const documentOverflow = (page: Page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

/**
 * Navigate and wait for the markup to be present and painted — deliberately
 * **not** for `load`.
 *
 * Every route is server-rendered, so what this spec measures is already in the
 * initial HTML; the banner wait just confirms the layout actually painted.
 * Waiting for `load` instead would block on the course overview's ~50 poster
 * images, which buys nothing here — each sits in a container with reserved
 * dimensions, so late-arriving bytes cannot change the geometry.
 *
 * That matters because this suite runs against `next dev`. Measured directly,
 * the course overview loads in under 300ms in both Chromium and WebKit; under
 * three browser projects × four workers all requesting it at once, the dev
 * server stalls well past 30s. `e2e/course-overview.spec.ts` already fails on
 * WebKit and Firefox for that reason, before this spec existed. The cause is
 * server throughput under test concurrency, not the browsers and not the page.
 */
const gotoRendered = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // The banner landmark, not `header` — the module overview renders its own
  // `<header>` for the module title, so the bare tag matches two elements.
  await page.getByRole("banner").waitFor({ state: "visible" });
};

/**
 * Navigate and wait for hydration, for the tests that actually interact.
 *
 * Opening the locale menu needs React to have attached its handlers; a click
 * that lands before hydration is silently dropped. These tests all run against
 * the home route, which is light enough that waiting for `load` costs nothing.
 */
const gotoInteractive = async (page: Page, path: string) => {
  await page.goto(path);
  await expect(page.getByRole("button", { name: /idioma/i })).toBeEnabled();
};

for (const viewport of PHONE_WIDTHS) {
  test.describe(`Mobile viewport fit — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    // `mode: "default"` opts this sweep out of the config's `fullyParallel`,
    // so its navigations queue in one worker instead of racing each other for
    // the dev server. Measured on WebKit: 25 tests in 14s serially, versus
    // 1.6min and a timeout on the course overview when spread across four
    // workers. Not `mode: "serial"` — that would skip the remaining routes
    // after the first failure, and a sweep needs to report every one.
    //
    // Serialising within a project is as far as this file can go: the three
    // browser projects still run concurrently against one `next dev`, and on
    // WebKit the course overview loses that race deterministically — retrying
    // does not help. The same contention already fails `course-overview.spec.ts`
    // (7 tests) and `lesson-playback-resume.spec.ts` (4) on a clean checkout.
    // The fix is to run e2e against `next build && next start` rather than the
    // dev server, which is a `playwright.config.ts` change and its own concern.
    test.describe.configure({ mode: "default" });

    for (const locale of LOCALES) {
      const routes = routesFor(locale).filter(
        (route) => locale === "en" || LOCALE_SENSITIVE_ROUTES.has(route.name),
      );

      for (const route of routes) {
        test(`WHEN the ${route.name} renders in '${locale}' THEN the document does not scroll horizontally`, async ({
          page,
        }) => {
          // Against a dev server under three browser projects, the heavier
          // routes stall (see `gotoRendered`). The generous budget is for
          // server throughput, not for the app.
          test.slow();

          await gotoRendered(page, route.path);

          const { scrollWidth, clientWidth } = await documentOverflow(page);

          expect(
            scrollWidth,
            `${route.path} overflows by ${scrollWidth - clientWidth}px`,
          ).toBeLessThanOrEqual(clientWidth);
        });
      }
    }
  });
}

test.describe("Mobile viewport fit — header controls at 320px", () => {
  test.use({ viewport: { width: 320, height: 720 } });

  /** Worst case for label length: Spanish "Idioma"/"Oscuro" run longer than English. */
  const HOME = "/es";

  test("WHEN the header renders THEN both controls are fully within the viewport", async ({
    page,
  }) => {
    await gotoRendered(page, HOME);

    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const controls = [
      page.getByRole("button", { name: /idioma/i }),
      page.getByRole("button", { name: /tema/i }),
    ];

    for (const control of controls) {
      const box = (await control.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(clientWidth);
    }
  });

  test("WHEN the header renders THEN both controls offer a 44x44 hit area", async ({ page }) => {
    await gotoRendered(page, HOME);

    const controls = [
      page.getByRole("button", { name: /idioma/i }),
      page.getByRole("button", { name: /tema/i }),
    ];

    for (const control of controls) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("WHEN the locale control renders THEN it shows the active locale's short code", async ({
    page,
  }) => {
    await gotoRendered(page, HOME);

    // The value stays visible on a phone — abbreviated, never hidden.
    await expect(page.getByRole("button", { name: /idioma/i })).toContainText("ES");
  });

  test("WHEN a language is chosen from the menu THEN the app navigates to that locale", async ({
    page,
  }) => {
    await gotoInteractive(page, HOME);

    await page.getByRole("button", { name: /idioma/i }).click();
    await page.getByRole("menuitemradio", { name: /inglés/i }).click();

    await expect(page).toHaveURL(/\/en$/);
  });

  test("WHEN the locale menu is open THEN it does not push the document sideways", async ({
    page,
  }) => {
    await gotoInteractive(page, HOME);

    await page.getByRole("button", { name: /idioma/i }).click();
    await expect(page.getByRole("menu")).toBeVisible();

    const { scrollWidth, clientWidth } = await documentOverflow(page);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe("Mobile viewport fit — module list titles at 320px", () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test("WHEN titles share a long prefix THEN adjacent rows stay distinguishable", async ({
    page,
  }) => {
    await gotoRendered(page, `/en/courses/${COURSE_SLUG}/modules/${SHARED_PREFIX_MODULE.slug}`);

    const titles = page.locator("li span.font-semibold");
    const [first, second] = [await titles.nth(0).innerText(), await titles.nth(1).innerText()];

    // Both full titles are rendered, and they differ — the failure this
    // guards against is every row reading "Exercise 1 Pronunciati…".
    expect(first).not.toEqual(second);
    expect(first).toMatch(/Exercise 1 Pronunciation Step By Step Lesson/);
    expect(second).toMatch(/Exercise 2 Pronunciation Step By Step Lesson/);
  });

  test("WHEN a title wraps THEN its row keeps the Open action within the viewport", async ({
    page,
  }) => {
    await gotoRendered(page, `/en/courses/${COURSE_SLUG}/modules/${SHARED_PREFIX_MODULE.slug}`);

    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const box = (await page.getByRole("link", { name: /open/i }).first().boundingBox())!;

    expect(box.x + box.width).toBeLessThanOrEqual(clientWidth);
  });
});
