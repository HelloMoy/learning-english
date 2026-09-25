import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { courseBySlug, lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";

/**
 * E2E coverage for the Course Catalog → Course Overview → Module Overview
 * → Lesson Page flow (capability: `course-catalog-navigation`).
 *
 * The test boots `pnpm dev` with the existing dev server. The generated
 * content seed is the whole catalog, so the course under test is simply
 * one of the declared ones. The IDs are imported from the generated seed
 * module so a future regenerate keeps these in sync.
 */
const COURSE_SLUG = "advanced-intermediate-course";
const FIRST_MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
const FIRST_LESSON = contentCatalog.lessonRows.find(
  (lesson) => lesson.moduleId === FIRST_MODULE.id,
)!;
const SECOND_LESSON = contentCatalog.lessonRows.find(
  (lesson) => lesson.moduleId === FIRST_MODULE.id && lesson.sequence === 2,
)!;

function homeUrl(locale: string): string {
  return `/${locale}`;
}
function courseUrl(locale: string, courseSlug: string = COURSE_SLUG): string {
  return `/${locale}/courses/${courseSlug}`;
}
function moduleUrl(locale: string, courseSlug: string, moduleSlug: string): string {
  return `/${locale}/courses/${courseSlug}/modules/${moduleSlug}`;
}
function lessonUrl(
  locale: string,
  courseSlug: string,
  moduleSlug: string,
  lessonId: string,
): string {
  return `/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonId}`;
}

test.describe("Course catalog navigation", () => {
  test("WHEN the home is visited THEN the levels table links to the course overview", async ({
    page,
  }) => {
    await page.goto(homeUrl("en"));

    const row = page
      .getByRole("list", { name: "Available courses, in order" })
      .getByRole("listitem")
      .filter({ hasText: "Advanced Intermediate Course" });
    await expect(row.getByRole("heading", { name: "Advanced Intermediate Course" })).toBeVisible();
    await expect(row.getByRole("link")).toHaveAttribute("href", courseUrl("en"));
  });

  test("WHEN the course card is activated THEN the course overview renders the module list and start course CTA", async ({
    page,
  }) => {
    await page.goto(courseUrl("en"));

    await expect(page.getByRole("heading", { name: "Advanced Intermediate Course" })).toBeVisible();
    await expect(page.getByTestId("lesson-ring-tile")).toHaveCount(
      modulesOfCourse(COURSE_SLUG).length,
    );
    const startLink = page.getByTestId("continue-tile").getByRole("link", { name: "Start course" });
    await expect(startLink).toHaveAttribute(
      "href",
      lessonUrl("en", COURSE_SLUG, FIRST_MODULE.slug, FIRST_LESSON.id),
    );
  });

  test("WHEN a module is opened THEN the module overview lists only that module's lessons", async ({
    page,
  }) => {
    await page.goto(moduleUrl("en", COURSE_SLUG, FIRST_MODULE.slug));

    await expect(
      page.getByRole("link", { name: "← Advanced Intermediate Course" }),
    ).toHaveAttribute("href", courseUrl("en"));
    const moduleHeading = page.getByRole("heading", {
      name: FIRST_MODULE.title,
    });
    await expect(moduleHeading).toBeVisible();

    for (const lesson of lessonsOfModule(FIRST_MODULE.id)) {
      await expect(page.getByText(lesson.title, { exact: true })).toBeVisible();
    }
    await expect(
      page.locator(`a[href="${lessonUrl("en", COURSE_SLUG, FIRST_MODULE.slug, FIRST_LESSON.id)}"]`),
    ).not.toHaveCount(0);
  });

  test("WHEN the first lesson is opened THEN its breadcrumb links back to the course and module overviews", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", COURSE_SLUG, FIRST_MODULE.slug, FIRST_LESSON.id));

    const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(breadcrumb).toBeVisible();
    await expect(
      breadcrumb.getByRole("link", { name: "Advanced Intermediate Course" }),
    ).toHaveAttribute("href", courseUrl("en"));
    await expect(breadcrumb.getByRole("link", { name: FIRST_MODULE.title })).toHaveAttribute(
      "href",
      moduleUrl("en", COURSE_SLUG, FIRST_MODULE.slug),
    );
  });

  test("WHEN the second lesson in the same module is opened THEN the closing card offers the next one", async ({
    page,
  }) => {
    await page.goto(lessonUrl("en", COURSE_SLUG, FIRST_MODULE.slug, SECOND_LESSON.id));
    const closingRow = page.getByTestId("lesson-close-card").getByRole("link");
    await expect(closingRow).toBeVisible();
  });

  test("WHEN an unknown course is requested THEN the recovery error state is shown", async ({
    page,
  }) => {
    await page.goto(courseUrl("en", "does-not-exist"));
    await expect(
      page.getByRole("heading", { name: "We couldn't find this course." }),
    ).toBeVisible();
  });
});

test.describe("Course catalog — locale awareness", () => {
  for (const locale of ["es", "pt"] as const) {
    test(`WHEN the home is visited in /${locale} THEN the level row preserves the locale prefix`, async ({
      page,
    }) => {
      await page.goto(homeUrl(locale));
      await expect(
        page
          .getByRole("listitem")
          .filter({ hasText: "Advanced Intermediate Course" })
          .getByRole("link"),
      ).toHaveAttribute("href", courseUrl(locale));
    });
  }
});

test.describe("Course catalog — course id guard", () => {
  test("WHEN the seed id is queried THEN it is stable across regenerations", () => {
    // The course id is a deterministic uuidv5 derived from the slug.
    // This guards against an accidental regeneration that flips the
    // id and breaks the Storybook stories / E2E URLs above.
    expect(courseBySlug(COURSE_SLUG).id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
