import { type Page } from "@playwright/test";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";

/**
 * E2E coverage for the course overview's hero, poster carousel and progress
 * panel (capabilities: `cinema-course-overview`, `course-vocabulary`).
 *
 * These are the assertions jsdom cannot make: that poster artwork actually
 * loads, that navigation lands on real routes, that progress saved in this
 * browser's storage drives the panel after hydration, and that the layout
 * neither overlaps the title nor widens the page on a phone.
 */
const COURSE_SLUG = "basic-course";
const MODULES = modulesOfCourse(COURSE_SLUG);
const COMPLETED_KEY_PREFIX = "learning-english:completed:";

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const courseUrl = (locale: string) => `/${locale}/courses/${COURSE_SLUG}`;
const moduleUrl = (moduleSlug: string) => `/en/courses/${COURSE_SLUG}/modules/${moduleSlug}`;

const indexOfFirstModuleWith = (predicate: (lessonCount: number) => boolean) =>
  MODULES.findIndex((module) => predicate(lessonsOfModule(module.id).length));

const dot = (page: Page, index: number) => page.getByTestId("carousel-dot").nth(index);
const selectedPoster = (page: Page) => page.locator('a[data-testid="carousel-poster"]');

test.describe("Course overview", () => {
  test.describe("GIVEN a learner with no progress on this device", () => {
    test("WHEN the page renders THEN the selected poster's artwork loads", async ({ page }) => {
      // Act
      await page.goto(courseUrl("en"));

      // Assert
      const image = selectedPoster(page).locator("img").first();
      await expect
        .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth), COLD_ROUTE)
        .toBeGreaterThan(0);
    });

    test("WHEN the next arrow is pressed THEN the second module becomes selected", async ({
      page,
    }) => {
      // Arrange
      await page.goto(courseUrl("en"));
      await expect(dot(page, 0)).toHaveAttribute("aria-current", "true", COLD_ROUTE);

      // Act
      await page.getByRole("button", { name: "Next lesson" }).click();

      // Assert
      await expect(dot(page, 1)).toHaveAttribute("aria-current", "true");
    });

    test("WHEN the selected poster of a module with several videos is clicked THEN its module overview opens", async ({
      page,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count > 1);
      await page.goto(courseUrl("en"));
      await dot(page, index).click(COLD_ROUTE);

      // Act
      await selectedPoster(page).click();

      // Assert
      await page.waitForURL(`**${moduleUrl(MODULES[index]!.slug)}`, COLD_ROUTE);
    });

    test("WHEN the selected poster of a one-video module is clicked THEN that video opens", async ({
      page,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count === 1);
      const onlyLesson = lessonsOfModule(MODULES[index]!.id)[0]!;
      await page.goto(courseUrl("en"));
      await dot(page, index).click(COLD_ROUTE);

      // Act
      await selectedPoster(page).click();

      // Assert
      await page.waitForURL(
        `**${moduleUrl(MODULES[index]!.slug)}/lessons/${onlyLesson.id}`,
        COLD_ROUTE,
      );
    });

    test("WHEN Start this lesson is activated in the panel THEN the module's first video opens", async ({
      page,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count > 1);
      const firstVideo = lessonsOfModule(MODULES[index]!.id)[0]!;
      await page.goto(courseUrl("en"));
      await dot(page, index).click(COLD_ROUTE);

      // Act
      await page
        .getByTestId("lesson-progress-panel")
        .getByRole("link", { name: "Start this lesson" })
        .click();

      // Assert
      await page.waitForURL(
        `**${moduleUrl(MODULES[index]!.slug)}/lessons/${firstVideo.id}`,
        COLD_ROUTE,
      );
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

  test.describe("GIVEN a learner part-way through a module", () => {
    test("WHEN the page hydrates THEN that module is selected AND the panel offers to continue its first unfinished video", async ({
      page,
    }) => {
      // Arrange
      const index = indexOfFirstModuleWith((count) => count > 4);
      const lessons = lessonsOfModule(MODULES[index]!.id);
      const completedKeys = lessons
        .slice(0, 3)
        .map((lesson) => `${COMPLETED_KEY_PREFIX}${lesson.id}`);
      await page.addInitScript((keys) => {
        for (const key of keys) window.localStorage.setItem(key, "1");
      }, completedKeys);

      // Act
      await page.goto(courseUrl("en"));

      // Assert
      await expect(dot(page, index)).toHaveAttribute("aria-current", "true", COLD_ROUTE);
      const panel = page.getByTestId("lesson-progress-panel");
      await expect(panel).toHaveAttribute("data-state", "in-progress");
      await expect(panel).toContainText(`Pick up ${lessons[3]!.title}`);
      await expect(panel.getByRole("link", { name: "Continue" })).toHaveAttribute(
        "href",
        `${moduleUrl(MODULES[index]!.slug)}/lessons/${lessons[3]!.id}`,
      );
    });
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test.describe(`GIVEN a ${viewport.width}px-wide viewport`, () => {
      test.use({ viewport });

      test("WHEN the page renders THEN the meta line sits below the title AND the page does NOT scroll sideways", async ({
        page,
      }) => {
        // Act
        await page.goto(courseUrl("en"));
        const title = page.getByRole("heading", { level: 1 });
        await expect(title).toBeVisible(COLD_ROUTE);

        // Assert
        const titleBox = (await title.boundingBox())!;
        const metaBox = (await page.getByTestId("course-hero-meta").boundingBox())!;
        expect(metaBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height - 1);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      });
    });
  }
});
