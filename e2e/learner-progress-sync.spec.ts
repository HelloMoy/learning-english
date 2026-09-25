import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import type { VideoLesson } from "@/domain/entities/lesson/lesson";

import type { Browser, BrowserContext, Page } from "@playwright/test";

import { skipOnCi } from "./ci-unavailable";
import { lessonsOfModule, modulesOfCourse } from "./content-seed-fixtures";
import { expect, signInAs, test, type LearnerAccount } from "./learner-account-fixture";
import { ONBOARDED_LEARNER, seedLearnerProfile } from "./learner-profile-fixture";
import { currentTimeOf } from "./media-player-state";

/**
 * Covers the `learner-state` capability across devices: progress belongs to
 * the account, so what a learner does in one browser is there in another one
 * signed in as them.
 *
 * Each "device" is a separate browser context — its own cookies and its own
 * `localStorage` — signed in to the same account.
 */

/** Compiling a route on a cold `pnpm dev` overruns the default 5s timeout. */
const COLD_ROUTE = { timeout: 60_000 };

const BASIC = contentCatalog.courses[0]!;
const [INTRODUCTION] = modulesOfCourse(BASIC.slug);
const INTRODUCTION_LESSON = lessonsOfModule(INTRODUCTION!.id)[0]!;

/** A lecture long enough that a few seconds of play land mid-video. */
const WATCHED_COURSE_SLUG = "advanced-intermediate-course";
const WATCHED_MODULE = modulesOfCourse(WATCHED_COURSE_SLUG)[0]!;
const WATCHED_LESSON = contentCatalog.lessonRows
  .filter(
    (lesson): lesson is VideoLesson =>
      lesson.moduleId === WATCHED_MODULE.id && lesson.kind === "video",
  )
  .sort((a, b) => b.durationSeconds - a.durationSeconds)[0]!;

const lessonUrl = (courseSlug: string, moduleSlug: string, lessonId: string) =>
  `/en/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonId}`;

/** Opens a second browser — another device — signed in as the same learner. */
async function anotherDevice(browser: Browser, account: LearnerAccount): Promise<BrowserContext> {
  const device = await browser.newContext();
  await signInAs(device, account);
  return device;
}

/**
 * Plays the lesson until the player reports time passing, then lets it run.
 * The YouTube embed has to answer before a play is accepted, hence the wait
 * on `data-can-play`.
 */
async function playFor(page: Page, milliseconds: number): Promise<void> {
  const region = page.getByRole("region", { name: /video player/i });
  await expect(region).toBeVisible(COLD_ROUTE);
  await expect.poll(() => region.getAttribute("data-can-play"), COLD_ROUTE).not.toBeNull();
  await region.hover();
  await page.getByRole("button", { name: /^play$/i }).click();
  await expect.poll(() => currentTimeOf(region), { timeout: 30_000 }).toBeGreaterThan(0);
  await page.waitForTimeout(milliseconds);
}

test.describe("Progress follows the learner", () => {
  test("WHEN a lesson is marked on one device THEN another device shows it complete", async ({
    page,
    browser,
    learnerAccount,
    learnerState,
  }) => {
    await seedLearnerProfile(learnerState);
    await page.goto(lessonUrl(BASIC.slug, INTRODUCTION!.slug, INTRODUCTION_LESSON.id));
    await page.getByRole("button", { name: "Mark as complete" }).click(COLD_ROUTE);
    await expect
      .poll(() => learnerState.isCompleted(INTRODUCTION_LESSON.id), COLD_ROUTE)
      .toBe(true);

    const laptop = await anotherDevice(browser, learnerAccount);
    const other = await laptop.newPage();
    await other.goto(`/en/courses/${BASIC.slug}/modules/${INTRODUCTION!.slug}`);

    await expect(other.getByText("Lesson completed")).toBeVisible(COLD_ROUTE);
    await laptop.close();
  });

  test("WHEN a card is made on one device THEN another device goes straight to the course", async ({
    page,
    browser,
    learnerAccount,
  }) => {
    await page.goto("/en/start");
    await page.getByRole("textbox", { name: "Your name" }).fill(ONBOARDED_LEARNER.name, COLD_ROUTE);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("heading", { level: 1, name: "Now pick your avatar" }).waitFor(COLD_ROUTE);

    const laptop = await anotherDevice(browser, learnerAccount);
    const other = await laptop.newPage();
    await other.goto(`/en/courses/${BASIC.slug}`);

    await expect(other.getByTestId("course-overview")).toBeVisible(COLD_ROUTE);
    await expect(other).toHaveURL(`/en/courses/${BASIC.slug}`);
    await laptop.close();
  });

  test("WHEN a prize is claimed on one device THEN another device shows it claimed", async ({
    page,
    browser,
    learnerAccount,
    learnerState,
  }) => {
    await seedLearnerProfile(learnerState);
    await learnerState.completed([INTRODUCTION_LESSON.id]);
    await page.goto("/es/achievements");
    await page
      .getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` })
      .click(COLD_ROUTE);
    await expect.poll(() => learnerState.isPrizeClaimed(INTRODUCTION!.slug), COLD_ROUTE).toBe(true);

    const laptop = await anotherDevice(browser, learnerAccount);
    const other = await laptop.newPage();
    await other.goto("/es/achievements");

    await expect(other.getByText("Silbato: premio canjeado")).toBeAttached(COLD_ROUTE);
    await expect(
      other.getByRole("button", { name: `Reclamar el premio de ${INTRODUCTION!.title}` }),
    ).toHaveCount(0);
    await laptop.close();
  });
});

test.describe("Progress follows the learner — mid-video", () => {
  skipOnCi("youtube");

  test("WHEN the learner closes the tab mid-video THEN the latest position is saved for the next visit", async ({
    page,
    learnerState,
  }) => {
    await seedLearnerProfile(learnerState);
    await page.goto(lessonUrl(WATCHED_COURSE_SLUG, WATCHED_MODULE.slug, WATCHED_LESSON.id));

    await playFor(page, 3_000);
    await page.close({ runBeforeUnload: true });

    await expect
      .poll(() => learnerState.savedPosition(WATCHED_LESSON.id), COLD_ROUTE)
      .toBeGreaterThan(0);
  });
});
