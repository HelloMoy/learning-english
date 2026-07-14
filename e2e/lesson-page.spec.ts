import {
  SEED_LESSON_READING_A_ID,
  SEED_LESSON_READING_B_ID,
  SEED_LESSON_VIDEO_ID,
} from "@/adapters/persistence/in-memory/seed/seed";

import { expect, test } from "@playwright/test";

/**
 * E2E tests for the Lesson Page (capability: `lesson-page`).
 *
 * URLs are derived from `src/adapters/persistence/in-memory/seed/seed.ts`
 * — the production seed is the only fixture in v1, so the e2e suite and
 * the seed must agree on slugs and UUIDs. The IDs are imported from the
 * seed module directly so a future rename fails both at the same time.
 *
 * Spec coverage:
 *   - "A valid route renders the Lesson Page"
 *   - "The page renders all regions when the view is resolved"
 *   - "The Up next card points to the next lesson"
 *   - "The Up next card shows the terminal state when the course is complete"
 *   - "The button starts in the 'Mark as complete' state"
 *   - "Clicking the button changes the label"
 *   - "An unknown course renders an error state" (via Next.js notFound())
 *   - "A lesson that does not belong to the module renders an error state"
 *   - Module-not-in-course variant
 */

const COURSE_SLUG = "english-a1-pronunciation";
const MODULE_A_SLUG = "vowels-and-video-intro";
const MODULE_B_SLUG = "consonants-and-stress";
const VIDEO_LESSON_ID = SEED_LESSON_VIDEO_ID;
const READING_A_LESSON_ID = SEED_LESSON_READING_A_ID;
const READING_B_LESSON_ID = SEED_LESSON_READING_B_ID;

function lessonUrl(locale: string, moduleSlug: string, lessonId: string): string {
  return `/${locale}/courses/${COURSE_SLUG}/modules/${moduleSlug}/lessons/${lessonId}`;
}

test.describe("Lesson Page — happy path", () => {
  test("WHEN a valid route is visited THEN all regions render", async ({ page }) => {
    await page.goto(lessonUrl("en", MODULE_A_SLUG, VIDEO_LESSON_ID));

    // Breadcrumb shows three segments.
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();

    // Outline (left aside) is present. It renders as a <nav> with an
    // accessible name of "Course outline".
    await expect(page.getByRole("navigation", { name: /course outline/i })).toBeVisible();

    // Native video player renders with the lesson source.
    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("controls", "");

    // Resources card lists the seed resource (PDF on the video lesson).
    await expect(page.getByRole("region", { name: /resources/i })).toBeVisible();
    await expect(page.getByText("Vowel chart (PDF)")).toBeVisible();

    // Up next card points to the next lesson in the same module.
    const upNext = page.getByRole("region", { name: /up next/i });
    await expect(upNext).toBeVisible();
    await expect(upNext.getByRole("link")).toHaveAttribute(
      "href",
      new RegExp(`/modules/${MODULE_A_SLUG}/lessons/${READING_A_LESSON_ID}`),
    );

    // Mark as complete button starts in the incomplete state.
    const markComplete = page.getByRole("button", { name: /mark as complete/i });
    await expect(markComplete).toBeVisible();
  });

  test("WHEN mark-as-complete is clicked THEN the label toggles", async ({ page }) => {
    await page.goto(lessonUrl("en", MODULE_A_SLUG, VIDEO_LESSON_ID));

    const button = page.getByRole("button", { name: /mark as complete/i });
    await button.click();

    // After click, the label changes and the button is pressed.
    await expect(page.getByRole("button", { name: /marked complete/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /marked complete/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

test.describe("Lesson Page — cross-module navigation", () => {
  test("WHEN the current lesson is the last in its module THEN up-next links to the first lesson of the next module", async ({
    page,
  }) => {
    // Reading A is the last lesson in Module A (sequence 2 of 2). The next
    // lesson is the first lesson of Module B.
    await page.goto(lessonUrl("en", MODULE_A_SLUG, READING_A_LESSON_ID));

    const upNext = page.getByRole("region", { name: /up next/i });
    const link = upNext.getByRole("link");
    await expect(link).toHaveAttribute(
      "href",
      new RegExp(`/modules/${MODULE_B_SLUG}/lessons/${READING_B_LESSON_ID}`),
    );
  });

  test("WHEN the current lesson is the last lesson of the last module THEN up-next shows the terminal message", async ({
    page,
  }) => {
    // Reading B is the last lesson of the last module in the seed.
    await page.goto(lessonUrl("en", MODULE_B_SLUG, READING_B_LESSON_ID));

    const upNext = page.getByRole("region", { name: /up next/i });
    await expect(upNext.getByRole("link")).toHaveCount(0);
    await expect(upNext).toContainText(/end of the course/i);
  });
});

test.describe("Lesson Page — error states", () => {
  test("WHEN the URL contains an invalid UUID THEN the inline error state renders", async ({
    page,
  }) => {
    await page.goto(`/en/courses/${COURSE_SLUG}/modules/${MODULE_A_SLUG}/lessons/not-a-uuid`);

    // The localized error heading is shown with a "Go home" affordance.
    await expect(
      page.getByRole("heading", { name: /couldn't find this lesson in the module/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /go to the course list/i })).toBeVisible();
  });

  test("WHEN the course slug does not exist THEN the URL transitions to /404 with the localized 'course not found' message", async ({
    page,
  }) => {
    const response = await page.goto(
      `/en/courses/does-not-exist/modules/${MODULE_A_SLUG}/lessons/${VIDEO_LESSON_ID}`,
    );

    // The server short-circuits to notFound(); the route's not-found.tsx
    // renders the localized message and a "Go home" link.
    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL(/\/en\/courses\/does-not-exist\/404$/);
    await expect(page.getByRole("heading", { name: /couldn't find this course/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /go to the course list/i })).toBeVisible();
  });

  test("WHEN the module does not belong to the course THEN the inline error state renders", async ({
    page,
  }) => {
    await page.goto(`/en/courses/${COURSE_SLUG}/modules/does-not-exist/lessons/${VIDEO_LESSON_ID}`);

    await expect(
      page.getByRole("heading", { name: /couldn't find this module in the course/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /go to the course list/i })).toBeVisible();
  });

  test("WHEN the lesson does not belong to the resolved module THEN the inline error state renders", async ({
    page,
  }) => {
    // VIDEO_LESSON_ID belongs to Module A. Visit it under Module B's slug.
    await page.goto(lessonUrl("en", MODULE_B_SLUG, VIDEO_LESSON_ID));

    await expect(
      page.getByRole("heading", { name: /couldn't find this lesson in the module/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /go to the course list/i })).toBeVisible();
  });
});

test.describe("Lesson Page — locale awareness", () => {
  test("WHEN the locale is es THEN the UI chrome is translated", async ({ page }) => {
    await page.goto(lessonUrl("es", MODULE_A_SLUG, VIDEO_LESSON_ID));

    // The Spanish translation of "Mark as complete" appears.
    await expect(page.getByRole("button", { name: /marcar como completada/i })).toBeVisible();
  });
});
