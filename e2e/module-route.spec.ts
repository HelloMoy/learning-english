import { type Page } from "@playwright/test";

import { lessonsOfModule, moduleOfCourse } from "./content-seed-fixtures";
import { expect, test } from "./learner-profile-fixture";
import type { LearnerState } from "./learner-state-fixture";

/**
 * E2E coverage for the module overview's route (capability:
 * `cinema-module-overview`).
 *
 * The component tests cover step states, the featured card and the panel
 * against mocked translations. What only a real browser can confirm is the
 * layout the route depends on — the panel beside the route on a desktop and
 * above it on a phone, with nothing scrolling sideways — and that progress
 * stored by the real stores reaches the page after hydration.
 */
const COURSE_SLUG = "basic-course";
const MODULE = moduleOfCourse(COURSE_SLUG, "2-vowels");
const LESSONS = lessonsOfModule(MODULE.id);
const FINISHED_COUNT = 5;
const CURRENT_LESSON = LESSONS[FINISHED_COUNT]!;
const CURRENT_FRACTION = 0.4;
const COLD_ROUTE = { timeout: 60_000 };
/** Roughly three short words at the step title's phone size — below this a title reads word by word. */
const MIN_READABLE_TITLE_WIDTH = 150;

const MODULE_URL = `/en/courses/${COURSE_SLUG}/modules/${MODULE.slug}`;

async function seedReturningLearner(learnerState: LearnerState): Promise<void> {
  const currentDuration = CURRENT_LESSON.kind === "video" ? CURRENT_LESSON.durationSeconds : 0;
  await learnerState.completed(LESSONS.slice(0, FINISHED_COUNT).map((lesson) => lesson.id));
  await learnerState.position(CURRENT_LESSON.id, currentDuration * CURRENT_FRACTION);
}

/**
 * A learner who skipped ahead to videos 12–14, then went back to the start and
 * finished videos 1–2. The lesson page records the lesson opened last, so the
 * record points at video 2.
 */
async function seedLearnerWhoReturnedToTheStart(learnerState: LearnerState): Promise<void> {
  await learnerState.completed(
    [...LESSONS.slice(11, 14), ...LESSONS.slice(0, 2)].map((lesson) => lesson.id),
  );
  await learnerState.continueWatching({
    courseSlug: COURSE_SLUG,
    moduleSlug: MODULE.slug,
    lessonId: LESSONS[1]!.id,
  });
}

const route = (page: Page) => page.getByTestId("module-overview").getByRole("list");
const panelHeading = (page: Page) => page.getByRole("heading", { name: "Your progress" });

test.describe("Module overview route", () => {
  test.beforeEach(async ({ learnerState }) => {
    await seedReturningLearner(learnerState);
  });

  test("WHEN a returning learner opens the module THEN the first unfinished video is featured and the rest are placed on the route", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    const current = page.locator('[data-state="current"]');
    await expect(current).toHaveCount(1, COLD_ROUTE);
    await expect(current).toContainText(CURRENT_LESSON.title);
    await expect(current.getByRole("link", { name: "Continue" })).toBeVisible();
    await expect(page.locator('[data-state="finished"]')).toHaveCount(FINISHED_COUNT);
    await expect(page.locator('[data-state="upcoming"]')).toHaveCount(
      LESSONS.length - FINISHED_COUNT - 1,
    );
  });

  test("WHEN a returning learner opens the module THEN the panel states the finished share of the module", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    await expect(page.getByText(`${FINISHED_COUNT} of ${LESSONS.length} videos`)).toBeVisible(
      COLD_ROUTE,
    );
    await expect(page.getByText("29%")).toBeVisible();
  });

  test("WHEN the page is 1440px wide THEN the panel sits beside the route", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);
    await expect(page.locator('[data-state="current"]')).toHaveCount(1, COLD_ROUTE);

    const panelBox = await panelHeading(page).boundingBox();
    const routeBox = await route(page).boundingBox();

    expect(panelBox!.x).toBeGreaterThan(routeBox!.x + routeBox!.width);
  });

  test("WHEN the page is 390px wide THEN the panel sits above the route and nothing scrolls sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MODULE_URL);
    await expect(page.locator('[data-state="current"]')).toHaveCount(1, COLD_ROUTE);

    const panelBox = await panelHeading(page).boundingBox();
    const routeBox = await route(page).boundingBox();
    expect(panelBox!.y).toBeLessThan(routeBox!.y);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("WHEN the page is 390px wide THEN a step's title keeps a readable width beside its thumbnail", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MODULE_URL);
    await expect(page.locator('[data-state="current"]')).toHaveCount(1, COLD_ROUTE);

    const upcomingTitle = page.getByText(LESSONS[LESSONS.length - 1]!.title, { exact: true });
    const finishedTitle = page.getByText(LESSONS[0]!.title, { exact: true });

    expect((await upcomingTitle.boundingBox())!.width).toBeGreaterThanOrEqual(
      MIN_READABLE_TITLE_WIDTH,
    );
    expect((await finishedTitle.boundingBox())!.width).toBeGreaterThanOrEqual(
      MIN_READABLE_TITLE_WIDTH,
    );
  });

  test("WHEN the learner clicks an upcoming step's title THEN its lesson opens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    const upcoming = LESSONS[LESSONS.length - 1]!;
    await expect(page.locator('[data-state="current"]')).toHaveCount(1, COLD_ROUTE);

    // Aimed by coordinates, not at the title element: the step action's
    // stretched overlay sits on top of the title, so Playwright's actionability
    // check would call a locator click intercepted. Landing on the title's
    // pixels is exactly what proves the overlay carries the click.
    const title = page.getByText(upcoming.title, { exact: true });
    await title.scrollIntoViewIfNeeded();
    const box = (await title.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await page.waitForURL(`**${MODULE_URL}/lessons/${upcoming.id}`, COLD_ROUTE);
  });
});

test.describe("Module overview route — a learner who returned to the start", () => {
  test("WHEN they finished 12–14, went back and finished 1–2 THEN video 3 is featured, not video 15", async ({
    page,
    learnerState,
  }) => {
    await seedLearnerWhoReturnedToTheStart(learnerState);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    const current = page.locator('[data-state="current"]');
    await expect(current).toHaveCount(1, COLD_ROUTE);
    await expect(current).toContainText(LESSONS[2]!.title);
  });
});

/** Every Vowels video finished, and — when `isClaimed` — its prize claimed on the counter. */
async function seedFinishedModule(
  learnerState: LearnerState,
  { isClaimed }: { isClaimed: boolean },
): Promise<void> {
  await learnerState.completed(LESSONS.map((lesson) => lesson.id));
  if (isClaimed) await learnerState.claimedPrizes([MODULE.slug]);
}

const prizePanel = (page: Page) => page.getByRole("region", { name: "Your progress" });
const prizeFinale = (page: Page) => page.getByTestId("module-prize-finale");
const claimLinks = (page: Page) => page.getByRole("link", { name: "Claim the Vowels prize" });

test.describe("Module overview prize", () => {
  test("WHEN a returning learner opens the module THEN the panel and the end of the route show the hidden prize with its tickets", async ({
    page,
    learnerState,
  }) => {
    await seedReturningLearner(learnerState);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    const tag = `${FINISHED_COUNT} / ${LESSONS.length}`;
    await expect(prizeFinale(page).getByText(tag)).toBeVisible(COLD_ROUTE);
    await expect(prizePanel(page).getByText(tag)).toBeVisible();
    await expect(prizeFinale(page).getByText("???")).toBeVisible();
    await expect(page.getByText("Harmonica")).toHaveCount(0);
    await expect(route(page).getByRole("listitem")).toHaveCount(LESSONS.length);
  });

  test("WHEN every ticket is collected THEN Claim prize opens the counter asking for the Vowels prize", async ({
    page,
    learnerState,
  }) => {
    await seedFinishedModule(learnerState, { isClaimed: false });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    await expect(claimLinks(page)).toHaveCount(2, COLD_ROUTE);
    await prizeFinale(page).getByRole("link", { name: "Claim the Vowels prize" }).click();

    await page.waitForURL(`**/en/achievements?claim=${MODULE.slug}`, COLD_ROUTE);
  });

  test("WHEN every ticket is collected THEN Start Lesson 03 opens Consonants", async ({
    page,
    learnerState,
  }) => {
    await seedFinishedModule(learnerState, { isClaimed: false });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    await prizeFinale(page).getByRole("link", { name: "Start Lesson 03" }).click(COLD_ROUTE);

    await page.waitForURL(`**/en/courses/${COURSE_SLUG}/modules/3-consonants`, COLD_ROUTE);
  });

  test("WHEN the prize was claimed THEN the end of the route still hands on to Start Lesson 03", async ({
    page,
    learnerState,
  }) => {
    await seedFinishedModule(learnerState, { isClaimed: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    await expect(prizeFinale(page).getByRole("link", { name: "Start Lesson 03" })).toBeVisible(
      COLD_ROUTE,
    );
  });

  test("WHEN the prize was claimed on the counter THEN the module page reveals the harmonica and offers nothing to claim", async ({
    page,
    learnerState,
  }) => {
    await seedFinishedModule(learnerState, { isClaimed: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MODULE_URL);

    await expect(prizeFinale(page).getByText("Harmonica", { exact: true })).toBeVisible(COLD_ROUTE);
    await expect(prizePanel(page).getByText("Harmonica", { exact: true })).toBeVisible();
    await expect(claimLinks(page)).toHaveCount(0);
  });

  test("WHEN every ticket is collected on a 390px phone THEN the finale and its Claim prize link fit without sideways scrolling", async ({
    page,
    learnerState,
  }) => {
    await seedFinishedModule(learnerState, { isClaimed: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MODULE_URL);

    const finaleLink = prizeFinale(page).getByRole("link", { name: "Claim the Vowels prize" });
    await expect(finaleLink).toBeVisible(COLD_ROUTE);
    const box = (await finaleLink.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
