import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test } from "@playwright/test";

/**
 * E2E coverage for the home's ladder of levels and its continue-watching
 * panel (capabilities: `cinema-home`, `continue-watching`).
 *
 * These are the two things only a browser can show. Every component is
 * covered in isolation by Vitest + RTL; what is left is the pair of
 * integrations those cannot reach: the declared catalog actually booting,
 * and the `localStorage` round trip surviving a real navigation.
 *
 * Everything is derived from the generated seed — course count, titles,
 * ordinals, module previews — so declaring a course in the manifest moves
 * this suite with it instead of breaking it.
 */
const COURSES = contentCatalog.courses;
const FIRST_COURSE = COURSES[0]!;
const SECOND_COURSE = COURSES[1]!;

/** Modules of one course, in the order the ladder card previews them. */
const modulesOf = (courseId: string) =>
  contentCatalog.modules
    .filter((module) => module.courseId === courseId)
    .sort((a, b) => a.sequence - b.sequence);

/** The first lesson of a course's first module — the one a card links into. */
const firstLessonOf = (courseId: string) => {
  const module_ = modulesOf(courseId)[0]!;
  const lesson = contentCatalog.lessonRows
    .filter((row) => row.moduleId === module_.id)
    .sort((a, b) => a.sequence - b.sequence)[0]!;
  return { module: module_, lesson };
};

const FIRST = firstLessonOf(FIRST_COURSE.id);
const SECOND = firstLessonOf(SECOND_COURSE.id);

/** The ladder card previews three modules and counts the rest. */
const PREVIEWED_MODULES = 3;

const lessonUrl = (locale: string, courseSlug: string, moduleSlug: string, lessonId: string) =>
  `/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonId}`;

test.describe("Home — ladder of levels", () => {
  test("WHEN the home is visited THEN every catalog course gets a card, in ladder order", async ({
    page,
  }) => {
    await page.goto("/en");

    const cards = page.getByTestId("course-level-card");
    await expect(cards).toHaveCount(COURSES.length);
    for (const [index, course] of COURSES.entries()) {
      await expect(cards.nth(index)).toContainText(course.title);
    }
  });

  test("WHEN the home is visited THEN the courses section announces itself", async ({ page }) => {
    await page.goto("/en");

    await expect(page.getByText("Available courses")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `${COURSES.length} levels, in order` }),
    ).toBeVisible();
    await expect(page.getByText(`${COURSES.length} courses`)).toBeVisible();
  });

  test("WHEN the home is visited THEN each card carries its level ordinal", async ({ page }) => {
    await page.goto("/en");

    const ordinals = page.getByTestId("course-level-ordinal");
    for (const [index] of COURSES.entries()) {
      await expect(ordinals.nth(index)).toHaveText(`Level ${index + 1}`);
    }
  });

  test("WHEN a course holds more modules than the card previews THEN it counts the rest", async ({
    page,
  }) => {
    const modules = modulesOf(SECOND_COURSE.id);
    expect(modules.length).toBeGreaterThan(PREVIEWED_MODULES);

    await page.goto("/en");

    const card = page.getByTestId("course-level-card").nth(1);
    await expect(card.getByTestId("course-level-more")).toHaveText(
      `+${modules.length - PREVIEWED_MODULES} more`,
    );
    await expect(card).toContainText(modules[0]!.title);
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
    const lessonPath = lessonUrl("en", FIRST_COURSE.slug, FIRST.module.slug, FIRST.lesson.id);

    await page.goto(lessonPath);
    // The record is written on mount; the heading proves the page rendered.
    await expect(page.getByRole("heading", { name: FIRST.lesson.title })).toBeVisible();

    await page.goto("/en");

    const panel = page.getByTestId("continue-watching");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(FIRST.lesson.title);
    await expect(panel.getByTestId("continue-watching-breadcrumb")).toContainText(
      FIRST_COURSE.title,
    );

    await panel.getByTestId("continue-watching-resume").click();
    await expect(page).toHaveURL(new RegExp(`${FIRST.lesson.id}$`));
  });

  test("WHEN a lesson has been opened THEN its course is the one marked in progress", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", SECOND_COURSE.slug, SECOND.module.slug, SECOND.lesson.id));
    await expect(page.getByRole("heading", { name: SECOND.lesson.title })).toBeVisible();

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
    await page.goto(lessonUrl("en", SECOND_COURSE.slug, SECOND.module.slug, SECOND.lesson.id));
    await expect(page.getByRole("heading", { name: SECOND.lesson.title })).toBeVisible();

    await page.goto(lessonUrl("en", FIRST_COURSE.slug, FIRST.module.slug, FIRST.lesson.id));
    await expect(page.getByRole("heading", { name: FIRST.lesson.title })).toBeVisible();

    await page.goto("/en");

    const panel = page.getByTestId("continue-watching");
    await expect(panel).toContainText(FIRST.lesson.title);
    await expect(panel).not.toContainText(SECOND.lesson.title);
    await expect(page.getByTestId("course-level-card").nth(0)).toHaveAttribute(
      "data-state",
      "in-progress",
    );
  });
});
