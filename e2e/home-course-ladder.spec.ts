import { seedCourse, seedModules } from "@/adapters/persistence/in-memory/seed/seed";
import {
  seedContentCourse,
  seedContentLessonRows,
  seedContentModules,
} from "@/adapters/persistence/in-memory/seed/seed-content";

import { expect, test } from "@playwright/test";

/**
 * E2E coverage for the home's ladder of levels and its continue-watching
 * panel (capabilities: `cinema-home`, `continue-watching`).
 *
 * These are the two things only a browser can show. Every component is
 * covered in isolation by Vitest + RTL; what is left is the pair of
 * integrations those cannot reach: the two-course catalog actually booting
 * under `USE_COURSE_CONTENT_SEED=1` (the dev server Playwright starts sets
 * it), and the `localStorage` round trip surviving a real navigation.
 *
 * Ids and titles are imported from the seeds so a regeneration keeps these
 * in sync rather than silently drifting.
 */
const CONTENT_MODULE = seedContentModules[0]!;
const CONTENT_LESSON = seedContentLessonRows.find(
  (lesson) => lesson.moduleId === CONTENT_MODULE.id,
)!;
const A1_MODULE = seedModules[0]!;

const lessonUrl = (locale: string, courseSlug: string, moduleSlug: string, lessonId: string) =>
  `/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonId}`;

test.describe("Home — ladder of levels", () => {
  test("WHEN the home is visited THEN every catalog course gets a card, in ladder order", async ({
    page,
  }) => {
    await page.goto("/en");

    const cards = page.getByTestId("course-level-card");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText(seedCourse.title);
    await expect(cards.nth(1)).toContainText(seedContentCourse.title);
  });

  test("WHEN the home is visited THEN the courses section announces itself", async ({ page }) => {
    await page.goto("/en");

    await expect(page.getByText("Available courses")).toBeVisible();
    await expect(page.getByRole("heading", { name: "2 levels, in order" })).toBeVisible();
    await expect(page.getByText("2 courses")).toBeVisible();
  });

  test("WHEN the home is visited THEN each card carries its level ordinal", async ({ page }) => {
    await page.goto("/en");

    const ordinals = page.getByTestId("course-level-ordinal");
    await expect(ordinals.nth(0)).toHaveText("Level 1");
    await expect(ordinals.nth(1)).toHaveText("Level 2");
  });

  test("WHEN the catalog holds ten modules THEN the card previews some and counts the rest", async ({
    page,
  }) => {
    await page.goto("/en");

    const advancedCard = page.getByTestId("course-level-card").nth(1);
    await expect(advancedCard.getByTestId("course-level-more")).toHaveText("+7 more");
    await expect(advancedCard).toContainText(CONTENT_MODULE.title);
  });

  test("WHEN the home is visited in /es THEN the ladder copy is localized", async ({ page }) => {
    await page.goto("/es");

    await expect(page.getByText("Cursos disponibles")).toBeVisible();
    await expect(page.getByTestId("course-level-ordinal").nth(0)).toHaveText("Nivel 1");
  });
});

test.describe("Home — continue watching", () => {
  test("WHEN nothing has been opened THEN the home offers nothing to continue", async ({
    page,
  }) => {
    await page.goto("/en");

    await expect(page.getByTestId("course-ladder")).toBeVisible();
    await expect(page.getByTestId("continue-watching")).toHaveCount(0);
    // Every card reads as not started, and none is falsely marked.
    await expect(
      page.getByTestId("course-level-card").filter({ hasText: "In progress" }),
    ).toHaveCount(0);
  });

  test("WHEN a lesson has been opened THEN the home offers it back and Resume returns to it", async ({
    page,
  }) => {
    const lessonPath = lessonUrl(
      "en",
      seedContentCourse.slug,
      CONTENT_MODULE.slug,
      CONTENT_LESSON.id,
    );

    await page.goto(lessonPath);
    // The record is written on mount; the heading proves the page rendered.
    await expect(page.getByRole("heading", { name: CONTENT_LESSON.title })).toBeVisible();

    await page.goto("/en");

    const panel = page.getByTestId("continue-watching");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(CONTENT_LESSON.title);
    await expect(panel.getByTestId("continue-watching-breadcrumb")).toContainText(
      seedContentCourse.title,
    );

    await panel.getByTestId("continue-watching-resume").click();
    await expect(page).toHaveURL(new RegExp(`${CONTENT_LESSON.id}$`));
  });

  test("WHEN a lesson has been opened THEN its course is the one marked in progress", async ({
    page,
  }) => {
    await page.goto(
      lessonUrl("en", seedContentCourse.slug, CONTENT_MODULE.slug, CONTENT_LESSON.id),
    );
    await expect(page.getByRole("heading", { name: CONTENT_LESSON.title })).toBeVisible();

    await page.goto("/en");

    const cards = page.getByTestId("course-level-card");
    await expect(cards.nth(1)).toHaveAttribute("data-state", "in-progress");
    await expect(cards.nth(0)).toHaveAttribute("data-state", "not-started");
    await expect(cards.nth(1).getByTestId("course-level-cta")).toHaveText("Continue course");
    await expect(cards.nth(0).getByTestId("course-level-cta")).toHaveText("Start course");
  });

  test("WHEN a second lesson is opened THEN the home offers the more recent one", async ({
    page,
  }) => {
    const a1Lesson = "22222222-2222-4222-8222-222222222220";

    await page.goto(
      lessonUrl("en", seedContentCourse.slug, CONTENT_MODULE.slug, CONTENT_LESSON.id),
    );
    await expect(page.getByRole("heading", { name: CONTENT_LESSON.title })).toBeVisible();

    await page.goto(lessonUrl("en", seedCourse.slug, A1_MODULE.slug, a1Lesson));
    await expect(page.getByRole("heading", { name: "Vowels: short vs. long" })).toBeVisible();

    await page.goto("/en");

    const panel = page.getByTestId("continue-watching");
    await expect(panel).toContainText("Vowels: short vs. long");
    await expect(panel).not.toContainText(CONTENT_LESSON.title);
    await expect(page.getByTestId("course-level-card").nth(0)).toHaveAttribute(
      "data-state",
      "in-progress",
    );
  });
});
