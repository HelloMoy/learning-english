import { type Page } from "@playwright/test";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";

/**
 * E2E coverage for the course overview's continue tile, course progress tile
 * and lesson ring tiles (capabilities: `cinema-course-overview`,
 * `course-vocabulary`).
 *
 * These are the assertions jsdom cannot make: that tile artwork actually loads,
 * that tiles navigate to real routes, that progress saved in this browser's
 * storage — and the continue-watching record a lesson page writes — drive the
 * tiles after hydration, and that the layout does not widen the page on a phone.
 */
const COURSE_SLUG = "basic-course";
const MODULES = modulesOfCourse(COURSE_SLUG);

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const courseUrl = (locale: string) => `/${locale}/courses/${COURSE_SLUG}`;
const moduleUrl = (moduleSlug: string, locale = "en") =>
  `/${locale}/courses/${COURSE_SLUG}/modules/${moduleSlug}`;
const lessonUrl = (moduleSlug: string, lessonId: string, locale = "en") =>
  `${moduleUrl(moduleSlug, locale)}/lessons/${lessonId}`;

const indexOfFirstModuleWith = (predicate: (lessonCount: number) => boolean) =>
  MODULES.findIndex((module) => predicate(lessonsOfModule(module.id).length));

const tiles = (page: Page) => page.getByTestId("lesson-ring-tile");
const tileOf = (page: Page, index: number) =>
  page.getByRole("link", { name: `Open lesson ${index + 1}: ${MODULES[index]!.title}` });

test.describe("Course overview", () => {
  test.describe("GIVEN a learner with no progress on this device", () => {
    test("WHEN the page renders THEN every lesson is a tile in order AND its artwork loads", async ({
      page,
    }) => {
      // Act
      await page.goto(courseUrl("en"));

      // Assert
      await expect(tiles(page)).toHaveCount(MODULES.length, COLD_ROUTE);
      expect(
        await tiles(page).evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("aria-label")),
        ),
      ).toEqual(MODULES.map((module, index) => `Open lesson ${index + 1}: ${module.title}`));
      const artwork = tileOf(page, 0).locator("img").last();
      await expect
        .poll(() => artwork.evaluate((node) => (node as HTMLImageElement).naturalWidth), COLD_ROUTE)
        .toBeGreaterThan(0);
    });

    test("WHEN progress settles THEN Start course opens the course's first video", async ({
      page,
    }) => {
      // Arrange
      const firstVideo = lessonsOfModule(MODULES[0]!.id)[0]!;

      // Act
      await page.goto(courseUrl("en"));

      // Assert
      const start = page.getByTestId("continue-tile").getByRole("link", { name: "Start course" });
      await expect(start).toHaveAttribute(
        "href",
        lessonUrl(MODULES[0]!.slug, firstVideo.id),
        COLD_ROUTE,
      );
      await expect(page.getByTestId("course-progress-tile")).toContainText("0%");
    });

    test("WHEN the tile of a lesson with several videos is clicked THEN its module overview opens", async ({
      page,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count > 1);
      await page.goto(courseUrl("en"));

      // Act
      await tileOf(page, index).click(COLD_ROUTE);

      // Assert
      await page.waitForURL(`**${moduleUrl(MODULES[index]!.slug)}`, COLD_ROUTE);
    });

    test("WHEN the tile of a one-video lesson is clicked THEN that video opens", async ({
      page,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count === 1);
      const onlyLesson = lessonsOfModule(MODULES[index]!.id)[0]!;
      await page.goto(courseUrl("en"));

      // Act
      await tileOf(page, index).click(COLD_ROUTE);

      // Assert
      await page.waitForURL(`**${lessonUrl(MODULES[index]!.slug, onlyLesson.id)}`, COLD_ROUTE);
    });

    for (const locale of ["en", "es"]) {
      test(`WHEN the page renders in ${locale} THEN no retired season OR episode vocabulary appears`, async ({
        page,
      }) => {
        // Act
        await page.goto(courseUrl(locale));
        await expect(page.getByTestId("course-overview")).toBeVisible(COLD_ROUTE);

        // Assert
        const text = (await page.getByTestId("course-overview").innerText()).toLowerCase();
        for (const retired of ["season", "temporada", "episode", "episodio"]) {
          expect(text, `"${retired}" should be gone from the ${locale} overview`).not.toContain(
            retired,
          );
        }
      });
    }
  });

  test.describe("GIVEN a learner part-way through a lesson", () => {
    test("WHEN the page hydrates THEN that lesson's tile is in progress AND Continue opens its first unfinished video", async ({
      page,
      learnerState,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count > 4);
      const lessons = lessonsOfModule(MODULES[index]!.id);
      await learnerState.completed(lessons.slice(0, 3).map((lesson) => lesson.id));

      // Act
      await page.goto(courseUrl("en"));

      // Assert
      const tile = tileOf(page, index);
      await expect(tile).toHaveAttribute("data-status", "in-progress", COLD_ROUTE);
      await expect(tile).toHaveAttribute("data-current", "true");
      await expect(tile).toContainText(`3/${lessons.length}`);
      await expect(page.getByRole("link", { name: "Continue where you left off" })).toHaveAttribute(
        "href",
        lessonUrl(MODULES[index]!.slug, lessons[3]!.id),
      );
    });
  });

  test.describe("GIVEN a learner who opened a lesson of this course", () => {
    test("WHEN they return to the course THEN the continue tile offers that video", async ({
      page,
      learnerState,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count > 2);
      const lesson = lessonsOfModule(MODULES[index]!.id)[2]!;
      const openedLesson = lessonUrl(MODULES[index]!.slug, lesson.id, "es");
      await page.goto(openedLesson);
      await expect.poll(() => learnerState.lastOpenedLessonId(), COLD_ROUTE).toBe(lesson.id);

      // Act
      await page.goto(courseUrl("es"));

      // Assert
      const action = page.getByTestId("continue-tile").getByRole("link");
      await expect(action).toHaveText("Continuar donde lo dejaste", COLD_ROUTE);
      await expect(action).toHaveAttribute("href", openedLesson);
      await expect(page.getByTestId("continue-tile")).toContainText(lesson.title);
    });
  });

  test.describe("GIVEN the prizes these lessons redeem", () => {
    test("WHEN a prize has been claimed THEN its tile says so AND the course tile counts it", async ({
      page,
      learnerState,
    }) => {
      // Arrange: the claim the counter records when the learner takes the prize.
      await learnerState.claimedPrizes([MODULES[0]!.slug]);

      // Act
      await page.goto(courseUrl("en"));

      // Assert
      await expect(tileOf(page, 0)).toHaveAttribute("data-prize-claimed", "true", COLD_ROUTE);
      await expect(tileOf(page, 1)).toHaveAttribute("data-prize-claimed", "false");
      await expect(page.getByTestId("course-progress-tile")).toContainText(
        `1 of ${MODULES.length} prizes`,
      );
    });

    test("WHEN nothing has been claimed THEN every prize stays hidden", async ({ page }) => {
      // Act
      await page.goto(courseUrl("en"));

      // Assert
      await expect(page.getByTestId("course-progress-tile")).toContainText(
        `0 of ${MODULES.length} prizes`,
        COLD_ROUTE,
      );
      const locked = await tiles(page).evaluateAll((nodes) =>
        nodes.map((node) => node.querySelector("svg[data-prize]")?.getAttribute("data-locked")),
      );
      expect(new Set(locked)).toEqual(new Set(["true"]));
    });
  });

  test.describe("GIVEN a 390px-wide viewport", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("WHEN the page renders THEN each lesson is a full-width row AND the page does NOT scroll sideways", async ({
      page,
    }) => {
      // Act
      await page.goto(courseUrl("en"));
      await expect(tiles(page).first()).toBeVisible(COLD_ROUTE);

      // Assert
      const box = (await tiles(page).first().boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(390 - 2 * 16 - 1);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    });
  });

  test.describe("GIVEN a 1440px-wide viewport", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("WHEN the page renders THEN the continue tile sits beside the course tile AND the lessons share one row", async ({
      page,
    }) => {
      // Act
      await page.goto(courseUrl("en"));
      // The pending tiles are replaced by new elements once progress is read, so
      // measuring before then can catch a tile mid-swap with no box at all.
      await expect(page.getByTestId("continue-tile")).toHaveAttribute(
        "data-status",
        "read",
        COLD_ROUTE,
      );
      await expect(page.getByTestId("course-progress-tile")).toHaveAttribute("data-status", "read");

      // Assert
      const continueBox = (await page.getByTestId("continue-tile").boundingBox())!;
      const courseBox = (await page.getByTestId("course-progress-tile").boundingBox())!;
      expect(Math.abs(continueBox.y - courseBox.y)).toBeLessThan(2);
      expect(courseBox.x).toBeGreaterThan(continueBox.x + continueBox.width - 1);
      const tops = await tiles(page).evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
      );
      expect(new Set(tops).size).toBe(1);
    });
  });
});
