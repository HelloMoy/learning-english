import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { type Page } from "@playwright/test";

import { skipOnCi } from "./ci-unavailable";
import { modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";

/**
 * E2E coverage for the `loading-skeletons` capability.
 *
 * @remarks
 * Two behaviors here cannot be reached from Vitest, and only those two are
 * tested at this layer.
 *
 * The **video placeholder's retirement** depends on a real player booting a
 * real provider; jsdom loads none, so RTL can only observe the gate with
 * `useMediaState` mocked. Here the browser boots it for real.
 *
 * The **route shell** only exists during a navigation whose payload has not
 * arrived. Throttling the whole connection would make the test a race against
 * the machine it runs on, so the destination's payload is held for a fixed
 * delay instead, which makes the window deterministic.
 *
 * Both halves need the same trick from opposite directions. Against a local
 * server the player is ready in milliseconds, so a test that asserts the
 * placeholder is *present* has to stop the provider from loading — otherwise it
 * is racing a retirement that is working correctly. `holdTheProvider` does
 * that; the retirement test deliberately does not call it.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const FIRST_MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
const FIRST_LESSON = contentCatalog.lessonRows
  .filter((lesson) => lesson.moduleId === FIRST_MODULE.id)
  .sort((a, b) => a.sequence - b.sequence)[0]!;

const MODULE_PATH = `/en/courses/${COURSE_SLUG}/modules/${FIRST_MODULE.slug}`;
const LESSON_PATH = `${MODULE_PATH}/lessons/${FIRST_LESSON.id}`;

/** Long enough to observe the shell, short enough not to slow the suite. */
const HELD_PAYLOAD_MS = 4000;

/**
 * Stops the media provider from ever reporting that it can play, by refusing
 * the YouTube embed every lesson is served from. The placeholder then stays
 * up, which is what makes "it is present" assertable at all.
 */
const holdTheProvider = (page: Page) => page.route(/youtube|ytimg/, (route) => route.abort());

/**
 * Whether the suite drives a production build — `E2E_SERVER_COMMAND` is how CI
 * serves one (see `playwright.config.ts`). Only a production build prefetches
 * links, and the link's prefetch is what carries a route's shell to the
 * browser, so the route-shell tests mean nothing against `next dev`.
 */
const servesProductionBuild = process.env.E2E_SERVER_COMMAND === "pnpm start";

/**
 * Holds the navigation's own payload: a slow page. This is the reported bug in
 * one line: without a shell, the learner sits on the page they came from for
 * exactly this long and reads it as the page they asked for.
 *
 * Prefetches pass untouched. Holding them too would model a browser that
 * never prefetches, where the shell cannot arrive before the payload at all.
 */
const holdTheNavigation = (page: Page) =>
  page.route("**/*", async (route) => {
    const headers = route.request().headers();
    if (headers["rsc"] !== undefined && headers["next-router-prefetch"] === undefined) {
      await new Promise((resolve) => setTimeout(resolve, HELD_PAYLOAD_MS));
    }
    await route.continue();
  });

/**
 * Opens the module overview and waits until every prefetch of the lesson has
 * fully arrived — the state a learner is in when they read the list and tap a
 * lesson. Waiting on the response alone is not enough: it resolves on the
 * headers, and the shell is in the body. Playwright does not report when such a
 * body finishes, so completion is read from the browser's own Resource Timing,
 * which records an entry only once a response has been received in full.
 */
async function openModuleWithLessonPrefetched(page: Page) {
  let prefetchesStarted = 0;
  page.on("request", (request) => {
    const isLessonPrefetch =
      request.headers()["next-router-prefetch"] !== undefined &&
      new URL(request.url()).pathname === LESSON_PATH;
    if (isLessonPrefetch) prefetchesStarted += 1;
  });

  await page.goto(MODULE_PATH);
  await expect(lessonLink(page)).toBeVisible();
  await expect.poll(() => prefetchesStarted).toBeGreaterThan(0);
  await expect
    .poll(async () => (await lessonPrefetchesReceived(page)) >= prefetchesStarted)
    .toBe(true);
}

/** How many fetches of the lesson's path the browser has received in full. */
const lessonPrefetchesReceived = (page: Page) =>
  page.evaluate(
    (lessonPath) =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => new URL(entry.name).pathname === lessonPath).length,
    LESSON_PATH,
  );

/**
 * The lesson's own link.
 *
 * Matched by href because the visible label carries an ordinal, and filtered to
 * the non-decorative one: the row draws a thumbnail link too, which is
 * `aria-hidden` and sits *behind* the title link's stretched `::after`, so
 * clicking it is intercepted.
 */
const lessonLink = (page: Page) =>
  page.locator(`a[href*="/lessons/${FIRST_LESSON.id}"]:not([aria-hidden="true"])`).first();

/**
 * The dev server compiles a route the first time it is requested, which can
 * outlast the default assertion timeout on whichever test reaches the lesson
 * route first. The wait is the toolchain's, not the feature's.
 */
const FIRST_COMPILE_MS = 20_000;

test.describe("Loading skeletons — the lesson video frame", () => {
  test("WHEN the player cannot boot THEN the frame carries a placeholder rather than a black box", async ({
    page,
  }) => {
    await holdTheProvider(page);

    await page.goto(LESSON_PATH);

    await expect(page.getByTestId("lesson-video-skeleton")).toBeVisible({
      timeout: FIRST_COMPILE_MS,
    });
  });

  test("WHEN the placeholder is shown THEN it does not swallow taps meant for the player", async ({
    page,
  }) => {
    await holdTheProvider(page);
    await page.goto(LESSON_PATH);

    await expect(page.getByTestId("lesson-video-skeleton")).toHaveCSS("pointer-events", "none");
  });

  test("WHEN the placeholder is shown THEN it is invisible to assistive technology", async ({
    page,
  }) => {
    await holdTheProvider(page);
    await page.goto(LESSON_PATH);

    await expect(page.getByTestId("lesson-video-skeleton")).toHaveAttribute("aria-hidden", "true");
  });

  test("WHEN the player becomes ready THEN the placeholder is retired", async ({ page }) => {
    skipOnCi("youtube");
    // No hold and no mock: the real provider boots, and the placeholder leaves
    // on its own. This is the assertion the unit tests cannot make.
    await page.goto(LESSON_PATH);

    await expect(page.getByTestId("lesson-video-skeleton")).toBeHidden({ timeout: 30_000 });
  });
});

test.describe("Loading skeletons — route shells", () => {
  test.skip(!servesProductionBuild, "only a production build prefetches the shell");
  // The app's service worker claims the page moments after it loads, and
  // Playwright does not route requests that pass through one, so the hold
  // would depend on whether it had claimed the page yet. Its fetch handler
  // does nothing, so blocking it changes nothing about the shell.
  test.use({ serviceWorkers: "block" });

  test("WHEN a lesson is opened from its module THEN the shell replaces the previous page", async ({
    page,
  }) => {
    await openModuleWithLessonPrefetched(page);

    await holdTheNavigation(page);
    await lessonLink(page).click();

    await expect(page.getByTestId("lesson-shell-shapes")).toBeVisible();
    await expect(page.getByTestId("lesson-shell-frame")).toBeVisible();
  });

  test("WHEN a shell renders THEN it announces loading exactly once", async ({ page }) => {
    await openModuleWithLessonPrefetched(page);

    await holdTheNavigation(page);
    await lessonLink(page).click();

    await expect(page.getByTestId("lesson-shell-shapes")).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(1);
  });
});
