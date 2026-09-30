import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, FIRST_COURSE_SLUG, ONBOARDED_LEARNER, test } from "./learner-profile-fixture";

/**
 * Covers the `available-courses` capability: the learner's courses and the
 * ones they can still join, on `/[locale]/courses`.
 *
 * Every spec runs as an onboarded learner — a card, and enrolled in the Basic
 * Course.
 */

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const COURSES = contentCatalog.courses;
const BASIC = COURSES[0]!;
const ADVANCED = COURSES[1]!;
const REFERENCE = COURSES.find((course) => course.track === "reference")!;

test.describe("Available courses", () => {
  test("WHEN the learner opens Courses from the avatar menu THEN the page opens", async ({
    page,
  }) => {
    await page.goto("/en/learning");

    await page
      .getByRole("button", { name: `Learner menu for ${ONBOARDED_LEARNER.name}` })
      .click(COLD_ROUTE);
    await page.getByRole("menuitem", { name: "Courses" }).click();

    await expect(page).toHaveURL(/\/en\/courses$/, COLD_ROUTE);
    await expect(page.getByRole("heading", { level: 1, name: "Available courses" })).toBeVisible(
      COLD_ROUTE,
    );
    await expect(page.getByText(`${COURSES.length} courses · you’re enrolled in 1`)).toBeVisible();
  });

  test("WHEN the learner enrolls from the shelf THEN the course joins their courses AND stays after a reload", async ({
    page,
    learnerState,
  }) => {
    await page.goto("/en/courses");

    await page
      .getByTestId("course-shelf-card")
      .filter({ hasText: ADVANCED.title })
      .getByRole("button", { name: "Enroll" })
      .click(COLD_ROUTE);

    await expect(page.getByRole("heading", { level: 2, name: "1 more course" })).toBeVisible();
    await expect
      .poll(() => learnerState.enrolledCourseSlugs(), COLD_ROUTE)
      .toEqual([ADVANCED.slug, FIRST_COURSE_SLUG].sort());

    await page.reload();
    await expect(page.getByTestId("enrolled-course-card")).toContainText(
      ADVANCED.title,
      COLD_ROUTE,
    );
    await expect(
      page.getByTestId("course-shelf-card").filter({ hasText: ADVANCED.title }),
    ).toHaveCount(0);
  });

  test("WHEN the reference course is on the shelf THEN its card reads Reference AND the shelf keeps going after Level 1", async ({
    page,
  }) => {
    await page.goto("/en/courses");

    const card = page.getByTestId("course-shelf-card").filter({ hasText: REFERENCE.title });
    await expect(card).toContainText("Reference", COLD_ROUTE);
    await expect(card).not.toContainText(/Level \d/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Keep going after Level 1" }),
    ).toBeVisible();
  });

  test("WHEN the learner last watched the second course THEN it leads as last watched", async ({
    page,
    learnerState,
  }) => {
    const basicModule = modulesOfCourse(BASIC.slug)[1]!;
    const advancedModule = modulesOfCourse(ADVANCED.slug)[0]!;
    await learnerState.enrolled([ADVANCED.slug]);
    await learnerState.continueWatching({
      courseSlug: BASIC.slug,
      moduleSlug: basicModule.slug,
      lessonId: lessonsOfModule(basicModule.id)[0]!.id,
    });
    await learnerState.continueWatching({
      courseSlug: ADVANCED.slug,
      moduleSlug: advancedModule.slug,
      lessonId: lessonsOfModule(advancedModule.id)[0]!.id,
    });

    await page.goto("/en/courses");

    const hero = page.getByTestId("course-cinema-hero");
    await expect(hero.getByText("Last watched")).toBeVisible(COLD_ROUTE);
    await expect(hero.getByRole("heading", { level: 2, name: ADVANCED.title })).toBeVisible();
    await expect(page.getByTestId("enrolled-course-card")).toContainText(BASIC.title);
  });
});
