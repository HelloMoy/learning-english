import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test, type Page } from "@playwright/test";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";

/**
 * E2E coverage for the catalog's one-click navigation (capabilities:
 * `cinema-home`, `cinema-course-overview`, `cinema-module-overview`).
 *
 * Every hit area here is a stretched `::after` on a link that already exists.
 * jsdom gives pseudo-elements no layout, so a component test can only assert
 * the invariant that must survive — the link count and the accessible names,
 * which the RTL suites already own. Whether a click on the card body actually
 * navigates is a question about geometry and stacking, and only a browser can
 * answer it. That is what these specs are for.
 *
 * Every click here is aimed at the *container* — the card, the panel, the row —
 * at an offset inside its own padding, where no child of any kind renders.
 * Aiming at a child instead (the description, the title) would be rejected
 * before the browser saw it: Playwright checks what sits at the click point,
 * finds the overlay's originating link rather than the child, and calls the
 * click intercepted. The container is that link's ancestor, so the same point
 * passes the check and still proves the overlay carried the click.
 */

/** Inside the container's own padding, clear of every child it renders. */
const IN_THE_PADDING = { x: 16, y: 10 };
const FIRST_COURSE = contentCatalog.courses[0]!;
const SECOND_COURSE = contentCatalog.courses[1]!;

/** The first lesson of a course's first module — where a resume lands. */
const firstLessonOf = (courseSlug: string) => {
  const module_ = modulesOfCourse(courseSlug)[0]!;
  const lesson = lessonsOfModule(module_.id)[0]!;
  return { module: module_, lesson };
};

const SECOND_COURSE_START = firstLessonOf(SECOND_COURSE.slug);

const lessonUrl = (courseSlug: string, moduleSlug: string, lessonId: string) =>
  `/en/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonId}`;

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

/** My learning belongs to a learner, so the device needs a card before it opens. */
const withLearnerCard = (page: Page) =>
  page.addInitScript(() =>
    window.localStorage.setItem(
      "learning-english:learner-profile",
      JSON.stringify({ name: "Ana García", avatar: { kind: "initials" } }),
    ),
  );

test.describe("Home and My learning — one click to the course, one to the lesson", () => {
  test("WHEN a level row's link is pressed THEN the course overview opens", async ({ page }) => {
    await page.goto("/en");

    await page
      .getByRole("list", { name: "Available courses, in order" })
      .getByRole("listitem")
      .first()
      .getByRole("link")
      .click(COLD_ROUTE);

    await page.waitForURL(`**/en/courses/${FIRST_COURSE.slug}`, COLD_ROUTE);
    await expect(page.getByTestId("course-overview")).toBeVisible(COLD_ROUTE);
  });

  test("WHEN a lesson has been opened THEN My learning's Resume returns to it", async ({
    page,
  }) => {
    await withLearnerCard(page);
    const lessonPath = lessonUrl(
      SECOND_COURSE.slug,
      SECOND_COURSE_START.module.slug,
      SECOND_COURSE_START.lesson.id,
    );
    await page.goto(lessonPath);
    // The continue-watching record is written on mount; the heading proves
    // the lesson page got far enough to write it.
    await expect(page.getByRole("heading", { name: SECOND_COURSE_START.lesson.title })).toBeVisible(
      COLD_ROUTE,
    );

    await page.goto("/en/learning");

    await page.getByRole("link", { name: "Resume" }).first().click(COLD_ROUTE);

    await page.waitForURL(new RegExp(`${SECOND_COURSE_START.lesson.id}$`), COLD_ROUTE);
  });

  test("WHEN a lesson has been opened THEN My learning's quieter link still opens the course", async ({
    page,
  }) => {
    await withLearnerCard(page);
    await page.goto(
      lessonUrl(SECOND_COURSE.slug, SECOND_COURSE_START.module.slug, SECOND_COURSE_START.lesson.id),
    );
    await expect(page.getByRole("heading", { name: SECOND_COURSE_START.lesson.title })).toBeVisible(
      COLD_ROUTE,
    );

    await page.goto("/en/learning");

    await page.getByRole("link", { name: "View course content" }).first().click(COLD_ROUTE);

    await page.waitForURL(`**/en/courses/${SECOND_COURSE.slug}`, COLD_ROUTE);
    await expect(page.getByTestId("course-overview")).toBeVisible(COLD_ROUTE);
  });
});

test.describe("Course carousel — one click from the selected poster to the module", () => {
  test("WHEN the selected poster on the course overview is clicked THEN its module overview opens", async ({
    page,
  }) => {
    const modules = modulesOfCourse(FIRST_COURSE.slug);
    // A one-video module's poster opens its video instead, so aim at the first
    // module that actually has an overview worth opening.
    const moduleIndex = modules.findIndex((module) => lessonsOfModule(module.id).length > 1);
    await page.goto(`/en/courses/${FIRST_COURSE.slug}`);

    await page.getByTestId("carousel-dot").nth(moduleIndex).click(COLD_ROUTE);
    await page.locator('a[data-testid="carousel-poster"]').click();

    await page.waitForURL(
      `**/en/courses/${FIRST_COURSE.slug}/modules/${modules[moduleIndex]!.slug}`,
      COLD_ROUTE,
    );
    await expect(page.getByTestId("module-overview")).toBeVisible(COLD_ROUTE);
  });
});

test.describe("Video row — one click anywhere to the lesson", () => {
  test("WHEN the row's body is clicked THEN the lesson page opens", async ({ page }) => {
    const module_ = modulesOfCourse(FIRST_COURSE.slug)[0]!;
    const lesson = lessonsOfModule(module_.id)[0]!;
    await page.goto(`/en/courses/${FIRST_COURSE.slug}/modules/${module_.slug}`);

    // The row's top padding, above the thumbnail and clear of the action at
    // its far end.
    await page
      .getByRole("listitem")
      .filter({ hasText: lesson.title })
      .first()
      .click({ position: IN_THE_PADDING });

    await page.waitForURL(new RegExp(`${lesson.id}$`), COLD_ROUTE);
  });

  test("WHEN a row renders THEN its action names watching the video", async ({ page }) => {
    const module_ = modulesOfCourse(FIRST_COURSE.slug)[0]!;
    await page.goto(`/en/courses/${FIRST_COURSE.slug}/modules/${module_.slug}`);

    await expect(page.getByRole("link", { name: "Watch video" }).first()).toBeVisible(COLD_ROUTE);
    await expect(page.getByRole("link", { name: "Open", exact: true })).toHaveCount(0);
  });
});
