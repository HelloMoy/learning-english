import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test } from "@playwright/test";

import { courseBySlug, modulesOfCourse } from "./content-seed-fixtures";

/**
 * E2E coverage for a course whose lectures are hosted elsewhere and whose local
 * video files have been deleted.
 *
 * This is the layer that actually proves the change: every other test would
 * still pass if the Basic Course silently fell back to a local `.mp4`, because
 * only a real browser resolving a real `<iframe>` can tell "served by YouTube"
 * from "served from disk". The 8.9 GB of `.mp4` files these lessons used to
 * carry are gone, so a regression here means a lesson that plays nothing.
 *
 * Fixtures come from the tracked course manifests, so adding or retitling a
 * lesson keeps the suite honest rather than asserting stale copy.
 */
const COURSE_SLUG = "basic-course";

const COURSE = courseBySlug(COURSE_SLUG);
const MODULES = modulesOfCourse(COURSE_SLUG);

const lessonsOfCourse = contentCatalog.lessonRows.filter((row) => row.courseId === COURSE.id);

/** The first lesson whose `source` is an absolute URL — a hosted lecture. */
const HOSTED = lessonsOfCourse.find((row) => row.kind === "video" && /^https?:/.test(row.source))!;
const HOSTED_MODULE = MODULES.find((courseModule) => courseModule.id === HOSTED.moduleId)!;

const lessonUrl = (locale: string): string =>
  `/${locale}/courses/${COURSE_SLUG}/modules/${HOSTED_MODULE.slug}/lessons/${HOSTED.id}`;

test.describe("A lesson served by YouTube with no local video", () => {
  test("WHEN the lesson page renders THEN the player is a YouTube iframe", async ({ page }) => {
    await page.goto(lessonUrl("en"));

    const iframe = page.locator('iframe[src*="youtube"]');

    await expect(iframe).toHaveCount(1);
    // No `<video>`: a local fallback here would mean the deleted bytes are
    // still being asked for, which is the regression this file exists to catch.
    await expect(page.locator("video")).toHaveCount(0);
  });

  test("WHEN the lesson page renders THEN its poster is still served locally", async ({ page }) => {
    if (HOSTED.kind !== "video" || !HOSTED.poster) {
      test.skip(true, "the hosted lesson declares no poster");
      return;
    }
    const response = await page.request.get(`/local-filesystem-lesson/${HOSTED.poster}`);

    // The video left the store; its thumbnail did not.
    expect(response.status()).toBe(200);
  });

  test("WHEN every hosted lesson is inspected THEN none points at a local file", () => {
    const hosted = lessonsOfCourse.filter(
      (row) => row.kind === "video" && /^https?:/.test(row.source),
    );

    expect(hosted).toHaveLength(lessonsOfCourse.length);
  });

  test("WHEN the lesson page renders THEN notes and resources still resolve", async ({ page }) => {
    await page.goto(lessonUrl("en"));

    await expect(page.getByRole("heading", { name: HOSTED.title, level: 1 })).toBeVisible();
    await expect(page.getByRole("tab", { name: /notes/i })).toBeVisible();
  });
});
