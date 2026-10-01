import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { test as signedIn } from "./learner-account-fixture";
import {
  expect,
  FIRST_COURSE_SLUG,
  ONBOARDED_LEARNER,
  seedLearnerProfile,
  test,
} from "./learner-profile-fixture";

/**
 * Covers the `available-courses` capability: every catalog course as a poster
 * on `/[locale]/courses`, and the next-up bar for a learner enrolled in nothing.
 *
 * Most specs run as an onboarded learner — a card, and enrolled in the Basic
 * Course. The new-learner specs have a card and no enrollment.
 */

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const COURSES = contentCatalog.courses;
const BASIC = COURSES[0]!;
const ADVANCED = COURSES[1]!;
const REFERENCE = COURSES.find((course) => course.track === "reference")!;

const BASIC_FIRST_MODULE = modulesOfCourse(BASIC.slug)[0]!;
const BASIC_FIRST_VIDEO = lessonsOfModule(BASIC_FIRST_MODULE.id)[0]!;

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
    await expect(page.getByTestId("course-poster")).toHaveCount(COURSES.length);
    await expect(page.getByTestId("next-up-bar")).toHaveCount(0);
  });

  test("WHEN the learner activates Enroll on a poster THEN the course page opens AND they are not enrolled until they enroll there", async ({
    page,
    learnerState,
  }) => {
    await page.goto("/en/courses");
    const advancedPoster = page.getByTestId("course-poster").filter({ hasText: ADVANCED.title });

    await advancedPoster.getByRole("link", { name: "Enroll" }).click(COLD_ROUTE);

    await expect(page).toHaveURL(new RegExp(`/en/courses/${ADVANCED.slug}/about$`), COLD_ROUTE);
    const enrollOnCoursePage = page.getByRole("button", { name: "Enroll" }).first();
    await expect(enrollOnCoursePage).toBeVisible(COLD_ROUTE);
    expect(await learnerState.enrolledCourseSlugs()).toEqual([FIRST_COURSE_SLUG]);

    await enrollOnCoursePage.click();
    await expect
      .poll(() => learnerState.enrolledCourseSlugs(), COLD_ROUTE)
      .toEqual([ADVANCED.slug, FIRST_COURSE_SLUG].sort());

    await page.goto("/en/courses");
    await expect(advancedPoster.getByText("Enrolled")).toBeVisible(COLD_ROUTE);
    await expect(advancedPoster.getByRole("link", { name: "Enroll" })).toHaveCount(0);
  });

  test("WHEN the page is in Spanish THEN Inscribirme opens the Spanish course page", async ({
    page,
  }) => {
    await page.goto("/es/courses");
    const advancedPoster = page.getByTestId("course-poster").filter({ hasText: ADVANCED.title });

    await advancedPoster.getByRole("link", { name: "Inscribirme" }).click(COLD_ROUTE);

    await expect(page).toHaveURL(new RegExp(`/es/courses/${ADVANCED.slug}/about$`), COLD_ROUTE);
    await expect(page.getByRole("button", { name: "Inscribirme" }).first()).toBeVisible(COLD_ROUTE);
  });

  test("WHEN the reference course is not joined THEN its poster reads Reference with no level", async ({
    page,
  }) => {
    await page.goto("/en/courses");

    const poster = page.getByTestId("course-poster").filter({ hasText: REFERENCE.title });
    await expect(poster).toContainText("Reference", COLD_ROUTE);
    await expect(poster).not.toContainText(/Level \d/);
  });

  test("WHEN the learner last watched the second course THEN its poster leads", async ({
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

    const titles = page.getByTestId("course-poster").getByRole("heading", { level: 2 });
    await expect(titles.first()).toHaveText(ADVANCED.title, COLD_ROUTE);
    await expect(titles.nth(1)).toHaveText(BASIC.title);
  });
});

signedIn.describe("Available courses for a learner enrolled in nothing", () => {
  signedIn.beforeEach(async ({ learnerState }) => {
    await seedLearnerProfile(learnerState);
  });

  signedIn(
    "WHEN they open the page in Spanish THEN the next-up bar offers the Basic Course's first video above the heading",
    async ({ page }) => {
      await page.goto("/es/courses");

      const bar = page.getByTestId("next-up-bar");
      await expect(bar).toContainText(`Lo que sigue · ${BASIC.title}`, COLD_ROUTE);
      await expect(bar).toContainText(BASIC_FIRST_VIDEO.title);
      await expect(bar).toContainText(/Módulo 01 · 0 de \d+ videos · faltan/);
      const barTop = (await bar.boundingBox())!.y;
      const headingTop = (await page
        .getByRole("heading", { level: 1, name: "Cursos disponibles" })
        .boundingBox())!.y;
      expect(barTop).toBeLessThan(headingTop);
    },
  );

  signedIn(
    "WHEN they activate Start course THEN the Basic Course's first video opens",
    async ({ page }) => {
      await page.goto("/en/courses");

      await page
        .getByTestId("next-up-bar")
        .getByRole("link", { name: /Start course/ })
        .click(COLD_ROUTE);

      await expect(page).toHaveURL(new RegExp(`${BASIC_FIRST_VIDEO.id}$`), COLD_ROUTE);
    },
  );
});
