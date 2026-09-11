import messages from "@/messages/en.json";

import { devices, expect, test, type Page } from "@playwright/test";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";

/**
 * iPhone emulation minus `defaultBrowserType`, which Playwright refuses inside
 * a `describe` because it would force a new worker. The engine comes from the
 * project instead.
 */
function deviceWithoutEngine(device: (typeof devices)[string]) {
  const emulation: Record<string, unknown> = { ...device };
  delete emulation.defaultBrowserType;
  return emulation;
}

const IPHONE = deviceWithoutEngine(devices["iPhone 13"]);

const COURSE_SLUG = "basic-course";

/**
 * A lesson partway into a module, so the row has a real position to state
 * rather than "1 of N". The second module is used because the first is the
 * introduction and tends to be short.
 */
const MODULE = modulesOfCourse(COURSE_SLUG)[1]!;
const MODULE_LESSONS = lessonsOfModule(MODULE.id);
const LESSON = MODULE_LESSONS[Math.min(2, MODULE_LESSONS.length - 1)]!;
const LESSON_URL = `/en/courses/${COURSE_SLUG}/modules/${MODULE.slug}/lessons/${LESSON.id}`;

const OUTLINE_TITLE = messages.Components.Outline.title;

/** Opens the lesson and waits for the page to settle. */
async function openLesson(page: Page, search = "") {
  await page.goto(LESSON_URL + search);
  await expect(page.getByRole("main").first()).toBeVisible();
}

/**
 * E2E guards for the course-outline drawer (capability: `cinema-lesson-view`).
 *
 * **Deliberately thin.** The component tests already cover the row's structure
 * and its meter; what needs a real browser is the part jsdom cannot decide —
 * which branch a viewport actually gets, since both are always in the DOM and
 * only CSS tells them apart.
 *
 * Spec coverage:
 *   - "The course outline is a compact row on small viewports"
 *   - "The row is absent on desktop"
 *   - "A leftover switch parameter changes nothing"
 */
test.describe("Course outline drawer", () => {
  test.describe("on a phone", () => {
    test.use(IPHONE);

    test("WHEN the lesson opens THEN the compact row is the visible outline control", async ({
      page,
    }) => {
      await openLesson(page);

      const row = page.getByTestId("outline-drawer-row");
      await expect(row).toBeVisible();
      await expect(row).toContainText(OUTLINE_TITLE);
      await expect(row).toHaveAttribute("aria-expanded", "false");
    });

    test("WHEN the row is tapped THEN the outline expands onto the current lesson", async ({
      page,
    }) => {
      await openLesson(page);

      await page.getByTestId("outline-drawer-row").click();

      await expect(page.getByTestId("outline-drawer-row")).toHaveAttribute("aria-expanded", "true");
      // The desktop sidebar is in the DOM at every width, hidden by `lg:`
      // classes — so the assertion is on the row the learner can actually see.
      await expect(page.locator('a[aria-current="page"]').filter({ visible: true })).toHaveCount(1);
    });

    test("WHEN a leftover switch parameter is in the URL THEN nothing changes", async ({
      page,
    }) => {
      // `?outline=a|b|c` selected between three candidate presentations while
      // the choice was being made. The parameter is no longer read; a URL
      // carrying one must render the page a URL without one renders.
      await openLesson(page, "?outline=c");

      await expect(page.getByTestId("outline-drawer-row")).toBeVisible();
      await expect(page.locator("details")).toHaveCount(1);
    });
  });

  test.describe("on a desktop viewport", () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("WHEN the lesson opens THEN the sticky sidebar renders and the row does not", async ({
      page,
    }) => {
      await openLesson(page);

      await expect(page.locator("aside").first()).toBeVisible();
      await expect(page.getByTestId("outline-drawer-row")).toBeHidden();
    });
  });
});
