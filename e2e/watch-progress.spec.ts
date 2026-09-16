import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import type { VideoLesson } from "@/domain/entities/lesson/lesson";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { type BrowserContext, type Page } from "@playwright/test";

import { modulesOfCourse } from "./content-seed-fixtures";
import { expect, seedLearnerProfile, test } from "./learner-profile-fixture";

/**
 * E2E tests for the `watch-progress` capability.
 *
 * Fixtures come from the generated content seed, the same way
 * `lesson-playback-resume.spec.ts` resolves its own — a regenerated seed
 * keeps the assertions honest rather than pinning a lesson id.
 *
 * **What only this layer can prove.** The indicators are client islands
 * dropped into server-rendered pages. Component tests can seed storage and
 * assert what renders, but only a browser can show that a position written
 * by the player on one page is read by the meter on another, across a real
 * navigation and a real hydration.
 *
 * Spec coverage:
 *   - "A complete video shows a full bar" and "A partially watched video
 *     shows a partial bar" (watch-progress R5)
 *   - "A completed lesson is distinguishable in the video list"
 *     (cinema-module-overview)
 *   - "A module in progress offers to continue" and "The server render
 *     asserts no progress" (cinema-course-overview progress panel)
 *   - "A lesson watched to the end before the rule existed is complete"
 *     (watch-progress R4) — the seeded position is never marked
 */

const COURSE_SLUG = "advanced-intermediate-course";
const MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
const MODULE_LESSONS = contentCatalog.lessonRows
  .filter(
    (lesson): lesson is VideoLesson => lesson.moduleId === MODULE.id && lesson.kind === "video",
  )
  .sort((a, b) => a.sequence - b.sequence);

const FINISHED_LESSON = MODULE_LESSONS[0]!;
const PARTLY_WATCHED_LESSON = MODULE_LESSONS[1]!;

const playbackKeyFor = (lessonId: string): string => `learning-english:playback:${lessonId}`;

const moduleUrl = (locale: string): string =>
  `/${locale}/courses/${COURSE_SLUG}/modules/${MODULE.slug}`;

const courseUrl = (locale: string): string => `/${locale}/courses/${COURSE_SLUG}`;

/**
 * Seeds two positions before the first load: one past the finish threshold,
 * one a quarter of the way in.
 *
 * Neither lesson is ever marked through the button, so what the assertions
 * see is the derived rule — the whole point of deriving it rather than
 * backfilling a completion key.
 */
async function seedPositions(context: BrowserContext) {
  const finished = finishThresholdSeconds(FINISHED_LESSON.durationSeconds);
  const partly = PARTLY_WATCHED_LESSON.durationSeconds / 4;

  await context.addInitScript(
    ([entries]) => {
      try {
        window.localStorage.clear();
        for (const [key, value] of entries as [string, string][]) {
          window.localStorage.setItem(key, value);
        }
      } catch {
        // localStorage might not be available; ignore.
      }
    },
    [
      [
        [playbackKeyFor(FINISHED_LESSON.id), String(finished)],
        [playbackKeyFor(PARTLY_WATCHED_LESSON.id), String(partly)],
      ],
    ],
  );
  // After the clear, so the wipe does not take the learner card with it.
  await seedLearnerProfile(context);
}

/** The row for one lesson in the module overview's video list. */
const rowFor = (page: Page, title: string) => page.getByRole("listitem").filter({ hasText: title });

test.describe("watch progress", () => {
  test.beforeEach(async ({ context }) => {
    await seedPositions(context);
  });

  test("a lesson watched to its end reads full and carries the completion mark", async ({
    page,
  }) => {
    await page.goto(moduleUrl("en"));

    const row = rowFor(page, FINISHED_LESSON.title).first();
    await expect(row.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(row.getByTestId("lesson-completion-mark")).toBeVisible();
  });

  test("a lesson watched partway shows how far the learner got, without a mark", async ({
    page,
  }) => {
    await page.goto(moduleUrl("en"));

    const row = rowFor(page, PARTLY_WATCHED_LESSON.title).first();
    await expect(row.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    await expect(row.getByTestId("lesson-completion-mark")).toHaveCount(0);
  });

  test("a lesson never opened shows no bar at all", async ({ page }) => {
    await page.goto(moduleUrl("en"));

    const untouched = MODULE_LESSONS.find(
      (lesson) => lesson.id !== FINISHED_LESSON.id && lesson.id !== PARTLY_WATCHED_LESSON.id,
    );
    test.skip(untouched === undefined, "This module holds only the two seeded lessons");

    const row = rowFor(page, untouched!.title).first();
    await expect(row.getByRole("progressbar")).toHaveCount(0);
  });

  test("the course overview's lesson tile counts the finished lesson", async ({ page }) => {
    await page.goto(courseUrl("en"));

    // The seeded positions put the learner part-way through the first module,
    // so its tile reads in progress and the continue tile opens the part-watched video.
    const tile = page.getByRole("link", { name: `Open lesson 1: ${MODULE.title}` });
    await expect(tile).toHaveAttribute("data-status", "in-progress", { timeout: 60_000 });
    await expect(tile).toContainText(`1/${MODULE_LESSONS.length}`);
    await expect(page.getByTestId("continue-tile")).toContainText(PARTLY_WATCHED_LESSON.title);
  });

  test("a course the learner has not started shows no progress", async ({ context, page }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
    });
    await seedLearnerProfile(context);

    await page.goto(courseUrl("en"));
    await expect(page.getByTestId("course-overview")).toBeVisible();

    const statuses = page.getByTestId("lesson-ring-tile");
    await expect(statuses.first()).toHaveAttribute("data-status", "not-started", {
      timeout: 60_000,
    });
    expect(
      new Set(
        await statuses.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-status")),
        ),
      ),
    ).toEqual(new Set(["not-started"]));
    await expect(page.getByRole("progressbar")).toHaveCount(0);
  });
});
