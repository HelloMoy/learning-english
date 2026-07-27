import {
  seedContentLessons,
  seedContentModules,
} from "@/adapters/persistence/in-memory/seed/seed-content";

import { expect, test } from "@playwright/test";

/**
 * E2E coverage for the Immersion Cinema chrome and lesson UI (capabilities:
 * `cinema-home`, `cinema-lesson-view`). Uses the content seed — the course
 * the running dev server serves with `USE_COURSE_CONTENT_SEED=1`.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const FIRST_MODULE = seedContentModules[0]!;
const FIRST_LESSON = seedContentLessons.find((lesson) => lesson.moduleId === FIRST_MODULE.id)!;

// A module whose intro lesson carries bilingual notes (drives the tabs).
const NOTES_MODULE = seedContentModules.find((m) => m.slug === "3-contractions-reductions")!;
const NOTES_LESSON = seedContentLessons
  .filter((lesson) => lesson.moduleId === NOTES_MODULE.id)
  .sort((a, b) => a.sequence - b.sequence)[0]!;

test.describe("Immersion Cinema — chrome", () => {
  test("WHEN the home is visited THEN the wordmark and section eyebrow render", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(page.getByRole("link", { name: /learn.*english/i })).toBeVisible();
    await expect(page.getByText(/immersion cinema · home/i)).toBeVisible();
  });

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

    // Mark-as-complete is keyboard-reachable and toggles on activation.
    const button = page.getByRole("button", { name: /mark as complete/i });
    await button.focus();
    await expect(button).toBeFocused();
    await button.click();
    await expect(page.getByRole("button", { name: /marked complete/i })).toBeVisible();
  });
});
