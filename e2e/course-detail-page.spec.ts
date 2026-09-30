import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { modulesOfCourse } from "./content-seed-fixtures";
import { expect, FIRST_COURSE_SLUG, test } from "./learner-profile-fixture";

/**
 * Covers the `course-detail-page` capability: `/[locale]/courses/[courseSlug]`
 * shows a course page to a learner who has not joined the course, and the
 * progress board to one who has.
 *
 * Every spec runs as an onboarded learner enrolled only in the Basic Course.
 * These are the assertions jsdom cannot make: the switch against real learner
 * state, a real enrollment that survives a reload, and the phone layout.
 */

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const COURSES = contentCatalog.courses;
const ADVANCED = COURSES.find((course) => course.slug === "advanced-intermediate-course")!;
const ATLAS = COURSES.find((course) => course.track === "reference")!;

const courseUrl = (slug: string) => `/en/courses/${slug}`;

test.describe("Course page", () => {
  test.describe("GIVEN a learner who has not joined the Advanced course", () => {
    test("WHEN they open it THEN the course page says what it teaches AND offers Enroll", async ({
      page,
    }) => {
      // Act
      await page.goto(courseUrl(ADVANCED.slug));

      // Assert
      await expect(page.getByRole("heading", { level: 1, name: ADVANCED.title })).toBeVisible(
        COLD_ROUTE,
      );
      await expect(
        page.getByRole("region", { name: "By the last video you’ll be able to" }),
      ).toBeVisible(COLD_ROUTE);
      await expect(page.getByRole("button", { name: "Enroll" }).first()).toBeVisible();
      await expect(page.getByTestId("lesson-ring-tile")).toHaveCount(0);
    });

    test("WHEN they enroll from the page THEN it offers Start course AND the next visit opens the board", async ({
      page,
      learnerState,
    }) => {
      // Arrange
      await page.goto(courseUrl(ADVANCED.slug));
      const hero = page.getByTestId("course-detail-hero");

      // Act
      await hero.getByRole("button", { name: "Enroll" }).click(COLD_ROUTE);

      // Assert
      await expect(hero.getByRole("link", { name: "Start course" })).toBeVisible();
      await expect
        .poll(() => learnerState.enrolledCourseSlugs(), COLD_ROUTE)
        .toEqual([ADVANCED.slug, FIRST_COURSE_SLUG].sort());
      await page.reload();
      await expect(page.getByTestId("lesson-ring-tile")).toHaveCount(
        modulesOfCourse(ADVANCED.slug).length,
        COLD_ROUTE,
      );
    });

    test("WHEN they preview it from Available courses THEN the course page opens AND they are still not enrolled", async ({
      page,
      learnerState,
    }) => {
      // Arrange
      await page.goto("/en/courses");

      // Act
      await page
        .getByTestId("course-shelf-card")
        .filter({ hasText: ADVANCED.title })
        .getByRole("link", { name: "Preview course" })
        .click(COLD_ROUTE);

      // Assert
      await expect(page.getByTestId("course-detail-view")).toBeVisible(COLD_ROUTE);
      expect(await learnerState.enrolledCourseSlugs()).toEqual([FIRST_COURSE_SLUG]);
    });
  });

  test.describe("GIVEN a learner reading in Portuguese", () => {
    test("WHEN they open the Advanced course THEN its description, outcomes AND meta description are Portuguese", async ({
      page,
    }) => {
      // Arrange
      const portuguese = ADVANCED.translations!.pt!;

      // Act
      await page.goto(`/pt/courses/${ADVANCED.slug}`);

      // Assert
      await expect(page.getByText(portuguese.description!)).toBeVisible(COLD_ROUTE);
      await expect(page.getByText(portuguese.outcomes![0]!)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: ADVANCED.title })).toBeVisible();
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        new RegExp(portuguese.description!.slice(0, 40)),
      );
    });
  });

  test.describe("GIVEN a learner who has not joined the reference course", () => {
    test("WHEN they open it THEN it reads Reference AND counts the sounds it teaches", async ({
      page,
    }) => {
      // Act
      await page.goto(courseUrl(ATLAS.slug));

      // Assert
      const hero = page.getByTestId("course-detail-hero");
      await expect(hero.getByText("Reference", { exact: true })).toBeVisible(COLD_ROUTE);
      await expect(
        page.getByRole("heading", { level: 2, name: "49 sounds you’ll master" }),
      ).toBeVisible();
    });
  });

  test.describe("GIVEN a learner enrolled in the Basic Course", () => {
    test("WHEN they open it THEN the progress board renders AND the course page does not", async ({
      page,
    }) => {
      // Act
      await page.goto(courseUrl(FIRST_COURSE_SLUG));

      // Assert
      await expect(page.getByTestId("lesson-ring-tile")).toHaveCount(
        modulesOfCourse(FIRST_COURSE_SLUG).length,
        COLD_ROUTE,
      );
      await expect(page.getByTestId("course-detail-view")).toHaveCount(0);
    });
  });

  test.describe("GIVEN a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("WHEN the learner scrolls the course page THEN the bottom bar keeps Enroll in view", async ({
      page,
    }) => {
      // Arrange
      await page.goto(courseUrl(ADVANCED.slug));
      const bar = page.getByRole("complementary", { name: "Join this course" });
      await expect(bar).toBeVisible(COLD_ROUTE);

      // Act
      await page.getByRole("region", { name: /lessons, one prize each/ }).scrollIntoViewIfNeeded();

      // Assert
      await expect(bar.getByRole("button", { name: "Enroll" })).toBeInViewport();
    });
  });
});
