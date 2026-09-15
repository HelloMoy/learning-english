import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";

import { expect, test, type Page } from "@playwright/test";

import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { ONBOARDED_LEARNER, seedLearnerProfile } from "./learner-profile-fixture";

/**
 * E2E coverage for the course routes' learner-card gate (capability:
 * `learner-onboarding`).
 *
 * Only a browser shows the whole round trip: storage read after hydration, the
 * locale-aware replace to the onboarding, `next` surviving both steps, and the
 * learner landing back on the route they first asked for.
 */
const COURSE = contentCatalog.courses[0]!;
const MODULE = modulesOfCourse(COURSE.slug)[0]!;
const LESSON = lessonsOfModule(MODULE.id)[0]!;
const LESSON_PATH = `/courses/${COURSE.slug}/modules/${MODULE.slug}/lessons/${LESSON.id}`;
const NEXT_QUERY = `?next=${encodeURIComponent(LESSON_PATH)}`;

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const completeOnboarding = async (page: Page) => {
  await page.getByRole("textbox", { name: "Your name" }).fill(ONBOARDED_LEARNER.name, COLD_ROUTE);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { level: 1, name: "Now pick your avatar" }).waitFor(COLD_ROUTE);
  await page.getByRole("button", { name: "Continue" }).click();
};

test.describe("Course routes require a learner card", () => {
  test("WHEN a device without a card opens a lesson link THEN the onboarding opens and finishing returns to the lesson", async ({
    page,
  }) => {
    await page.goto(`/en${LESSON_PATH}`);
    await expect(page).toHaveURL(`/en/start${NEXT_QUERY}`, COLD_ROUTE);

    await completeOnboarding(page);

    await expect(page).toHaveURL(`/en${LESSON_PATH}`, COLD_ROUTE);
    await expect(page.getByRole("heading", { name: LESSON.title })).toBeVisible(COLD_ROUTE);
  });

  test("WHEN a device with a card opens a lesson link THEN the lesson stays open", async ({
    context,
    page,
  }) => {
    await seedLearnerProfile(context);

    await page.goto(`/en${LESSON_PATH}`);

    await expect(page.getByRole("heading", { name: LESSON.title })).toBeVisible(COLD_ROUTE);
    await expect(page).toHaveURL(`/en${LESSON_PATH}`);
  });

  test("WHEN a device without a card follows a landing course card THEN the onboarding opens carrying that course", async ({
    page,
  }) => {
    await page.goto("/en");

    await page
      .getByRole("list", { name: "Available courses, in order" })
      .getByRole("link")
      .first()
      .click(COLD_ROUTE);

    await expect(page).toHaveURL(/\/en\/start\?next=%2Fcourses%2F/, COLD_ROUTE);
  });

  test("WHEN next points off the site THEN finishing the onboarding opens My learning", async ({
    page,
  }) => {
    await page.goto(`/en/start?next=${encodeURIComponent("https://evil.example")}`);

    await completeOnboarding(page);

    await expect(page).toHaveURL("/en/learning", COLD_ROUTE);
  });

  test("WHEN the server renders a course route THEN the course content is in the HTML", async ({
    request,
  }) => {
    const response = await request.get(`/en/courses/${COURSE.slug}`);

    expect(await response.text()).toContain(COURSE.title);
  });
});
