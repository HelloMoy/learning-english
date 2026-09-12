import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test } from "@playwright/test";

import { moduleOfCourse, modulesOfCourse } from "./content-seed-fixtures";

/**
 * E2E coverage for the Immersion Cinema chrome and lesson UI (capabilities:
 * `cinema-home`, `cinema-lesson-view`). Fixtures come from the generated
 * content seed, which is the only catalog the app serves.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const FIRST_MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
const FIRST_LESSON = contentCatalog.lessonRows.find(
  (lesson) => lesson.moduleId === FIRST_MODULE.id,
)!;

// A module whose intro lesson carries bilingual notes (drives the tabs).
const NOTES_MODULE = moduleOfCourse(COURSE_SLUG, "3-contractions-reductions");
const NOTES_LESSON = contentCatalog.lessonRows
  .filter((lesson) => lesson.moduleId === NOTES_MODULE.id)
  .sort((a, b) => a.sequence - b.sequence)[0]!;

test.describe("Immersion Cinema — chrome", () => {
  test("WHEN the home is visited THEN the wordmark and section eyebrow render", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(page.getByRole("link", { name: /english.*course/i })).toBeVisible();
    await expect(page.getByText(/immersion cinema · home/i)).toBeVisible();
  });

  /**
   * `toBeVisible()` passes on a wordmark whose right half is clipped: the
   * header's brand group carries `overflow-hidden`, so a mark too wide for the
   * viewport is silently cut rather than scrolling the page. Geometry is the
   * only assertion that can see that, which is why this reads the bounding box.
   */
  for (const locale of ["en", "es", "pt"] as const) {
    test(`WHEN the home renders at 320px in ${locale} THEN the wordmark fits the viewport`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(`/${locale}`);

      const wordmark = page.getByRole("link", { name: /english.*course/i });
      const box = await wordmark.boundingBox();
      expect(box).not.toBeNull();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(box!.x + box!.width).toBeLessThanOrEqual(clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }

  test("WHEN a lesson is visited THEN the section eyebrow reads LESSON", async ({ page }) => {
    await page.goto(
      `/en/courses/${COURSE_SLUG}/modules/${FIRST_MODULE.slug}/lessons/${FIRST_LESSON.id}`,
    );
    await expect(page.getByText(/immersion cinema · lesson/i)).toBeVisible();
  });
});

test.describe("Immersion Cinema — lesson notes tabs", () => {
  test("WHEN a lesson renders THEN the Transcript tab is disabled and Mark-as-complete is reachable", async ({
    page,
  }) => {
    await page.goto(
      `/en/courses/${COURSE_SLUG}/modules/${NOTES_MODULE.slug}/lessons/${NOTES_LESSON.id}`,
    );

    // Notes/Transcript tabs render; Transcript is present but disabled.
    await expect(page.getByRole("tab", { name: /notes/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /transcript/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    // Mark-as-complete is keyboard-reachable and swaps state on activation.
    const button = page.getByRole("button", { name: /mark as complete/i });
    await button.focus();
    await expect(button).toBeFocused();
    await button.click();
    await expect(page.getByText(/lesson completed/i)).toBeVisible();
  });
});
