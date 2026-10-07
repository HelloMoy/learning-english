import type { Page } from "@playwright/test";

import { modulesOfCourse } from "./content-seed-fixtures";
import { expect, FIRST_COURSE_SLUG, test } from "./learner-profile-fixture";

/**
 * Covers the `route-transitions` capability: following a link through the app
 * hands the browser a view transition tagged with the motion for its route
 * pair, and everything untagged stays instant.
 *
 * What jsdom cannot show is the join between the three pieces — the flag in
 * `next.config.ts`, the boundary in the locale layout, and the `Link` that
 * names the motion — so these specs watch the one place they meet: the call
 * React makes to `document.startViewTransition`.
 *
 * Every spec runs as an onboarded learner enrolled in the Basic Course.
 */

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const CATALOG_URL = "/en/courses";
const PROGRESS_URL = `/en/courses/${FIRST_COURSE_SLUG}/progress`;
const MODULE_URL = `/en/courses/${FIRST_COURSE_SLUG}/modules/${modulesOfCourse(FIRST_COURSE_SLUG)[0]!.slug}`;

type RecordingWindow = Window & { routeTransitionCalls: string[][] };

/** Wraps `document.startViewTransition` so each call leaves its types behind. */
async function recordViewTransitions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const recordingWindow = window as unknown as RecordingWindow;
    recordingWindow.routeTransitionCalls = [];
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = (options) => {
      const types = typeof options === "object" && options?.types ? [...options.types] : [];
      recordingWindow.routeTransitionCalls.push(types);
      return start(options);
    };
  });
}

/** Removes the View Transitions API, as a browser without it would present. */
async function withoutViewTransitions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Document.prototype, "startViewTransition");
  });
}

const routeTypesOf = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as RecordingWindow).routeTransitionCalls
      .flat()
      .filter((type) => type.startsWith("route-")),
  );

const supportsViewTransitions = (page: Page) =>
  page.evaluate(() => typeof document.startViewTransition === "function");

const progressLink = (page: Page) => page.locator(`a[href="${PROGRESS_URL}"]`).first();
const firstLessonTile = (page: Page) => page.getByTestId("lesson-ring-tile").first();

/**
 * Opens a page with the recorder installed, skipping the spec on an engine
 * that has no View Transitions API to record.
 *
 * @remarks
 * Each spec follows one link from a page it opened itself. React does not
 * start a second view transition while one is still running, so a chain of
 * clicks in a single spec would count however many happened to fit.
 */
async function openRecording(page: Page, url: string): Promise<void> {
  await recordViewTransitions(page);
  await page.goto(url);
  test.skip(!(await supportsViewTransitions(page)), "This engine has no View Transitions API");
}

test.describe("Route transitions", () => {
  test.describe("GIVEN a browser with view transitions", () => {
    test("WHEN the learner opens a course from the catalog THEN the navigation goes in", async ({
      page,
    }) => {
      // Arrange
      await openRecording(page, CATALOG_URL);

      // Act
      await progressLink(page).click(COLD_ROUTE);
      await expect(firstLessonTile(page)).toBeVisible(COLD_ROUTE);

      // Assert
      await expect.poll(() => routeTypesOf(page)).toEqual(["route-depth-in"]);
    });

    test("WHEN the learner leaves a lesson's page for its course THEN the navigation comes out", async ({
      page,
    }) => {
      // Arrange
      await openRecording(page, MODULE_URL);

      // Act
      await progressLink(page).click(COLD_ROUTE);
      await expect(firstLessonTile(page)).toBeVisible(COLD_ROUTE);

      // Assert
      await expect.poll(() => routeTypesOf(page)).toEqual(["route-depth-out"]);
    });

    test("WHEN the learner presses the browser's back button THEN no route motion is added", async ({
      page,
    }) => {
      // Arrange
      await openRecording(page, CATALOG_URL);
      await progressLink(page).click(COLD_ROUTE);
      await expect(firstLessonTile(page)).toBeVisible(COLD_ROUTE);

      // Act
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${CATALOG_URL}$`));
      await expect(progressLink(page)).toBeVisible(COLD_ROUTE);

      // Assert
      expect(await routeTypesOf(page)).toEqual(["route-depth-in"]);
    });
  });

  test.describe("GIVEN a browser without view transitions", () => {
    test("WHEN the learner opens a course from the catalog THEN the page still arrives", async ({
      page,
    }) => {
      // Arrange
      await withoutViewTransitions(page);
      await page.goto(CATALOG_URL);

      // Act
      await progressLink(page).click(COLD_ROUTE);

      // Assert
      await expect(page).toHaveURL(new RegExp(`${PROGRESS_URL}$`), COLD_ROUTE);
      await expect(firstLessonTile(page)).toBeVisible(COLD_ROUTE);
    });
  });
});
