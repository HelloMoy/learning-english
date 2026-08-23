import {
  seedContentLessons,
  seedContentModules,
} from "@/adapters/persistence/in-memory/seed/seed-content";
import type { VideoLesson } from "@/domain/entities/lesson/lesson";

import { expect, test } from "@playwright/test";

/**
 * E2E tests for the playback-position resume cycle (capability:
 * `playback-position`).
 *
 * Targets the content seed, not the A1 seed: `playwright.config.ts` boots
 * the webServer with `USE_COURSE_CONTENT_SEED=1`, so the A1 course is not
 * served and its URLs render "We couldn't find this course."
 * `course-catalog.spec.ts` resolves its fixtures the same way.
 *
 * The lesson is picked as the longest video in the first module so the
 * 30s-from-start and 10s-from-end thresholds both have room, and the
 * duration is read off the entity rather than hardcoded — a regenerated
 * seed keeps the assertions honest.
 *
 * Persistence is `localStorage` (per the v1 design); each test starts from
 * a clean storage via an `addInitScript` that clears it. The storage key is
 * `learning-english:playback:{lessonId}`.
 *
 * Spec coverage:
 *   - "A position in the middle renders the overlay" (R5 — happy path)
 *   - "A trivial saved position skips the overlay" (R5 — negative case 1)
 *   - "A position near completion skips the overlay" (R5 — negative case 2)
 *   - "No stored position skips the overlay" (R5 — default case)
 *   - "First user interaction is required before the first write"
 *     (R4 — no cold-load overwrite with 0)
 *
 * The "click Resume → seeks" assertion checks that the wrapper seeks the
 * `<video>`: `currentTime` ends up at the saved value.
 */

const COURSE_SLUG = "advanced-intermediate-course";
const MODULE = seedContentModules[0]!;
const LESSON = seedContentLessons
  .filter(
    (lesson): lesson is VideoLesson => lesson.moduleId === MODULE.id && lesson.kind === "video",
  )
  .sort((a, b) => b.durationSeconds - a.durationSeconds)[0]!;
const LESSON_ID = LESSON.id;
const DURATION_SECONDS = LESSON.durationSeconds;
const STORAGE_KEY = `learning-english:playback:${LESSON_ID}`;

function lessonUrl(locale: string): string {
  return `/${locale}/courses/${COURSE_SLUG}/modules/${MODULE.slug}/lessons/${LESSON_ID}`;
}

/**
 * Wipes `localStorage` on the **first** load of the context only.
 *
 * `addInitScript` runs on every navigation, so an unconditional clear would
 * also fire on `page.reload()` — erasing the very position the test just
 * saved. The `sessionStorage` flag survives a reload within the same tab,
 * which is exactly the "only the first load" scope needed here.
 */
async function clearStorageFor(context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(() => {
    const ALREADY_CLEARED = "__e2e_storage_cleared__";
    try {
      if (window.sessionStorage.getItem(ALREADY_CLEARED) === null) {
        window.localStorage.clear();
        window.sessionStorage.setItem(ALREADY_CLEARED, "1");
      }
    } catch {
      // localStorage might not be available; ignore.
    }
  });
}

async function seedSavedPosition(
  context: import("@playwright/test").BrowserContext,
  seconds: number,
) {
  await context.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    },
    [STORAGE_KEY, String(seconds)],
  );
}

async function readSavedPosition(page: import("@playwright/test").Page): Promise<number | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, STORAGE_KEY);
}

test.describe("Lesson playback-position resume cycle", () => {
  test("WHEN no position has been saved THEN the overlay does NOT render on cold load", async ({
    page,
    context,
  }) => {
    await clearStorageFor(context);
    await page.goto(lessonUrl("en"));

    const dialog = page.getByRole("dialog", { name: /resume playback/i });
    await expect(dialog).not.toBeVisible();

    // The player itself is visible.
    await expect(page.locator("video")).toBeVisible();
  });

  test("WHEN the learner seeks to 0:30 and pauses THEN reload surfaces the resume overlay with 00:30", async ({
    page,
    context,
  }) => {
    test.setTimeout(20_000);
    await clearStorageFor(context);
    await page.goto(lessonUrl("en"));
    const video = page.locator("video");
    await expect(video).toBeVisible();

    // Seek to 0:30 without involving the browser's lazy-load pipeline —
    // we set `currentTime` and dispatch a `seeked` event so lifecycle
    // subscribers fire synchronously.
    await video.evaluate(async (el) => {
      const v = el as HTMLVideoElement;
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          v.removeEventListener("seeked", onSeeked);
          resolve();
        };
        v.addEventListener("seeked", onSeeked);
        v.currentTime = 30;
      });
      // Trigger a synthetic `play` so the wrapper flips hasInteracted.
      // Then `pause` so the immediate write fires (bypass debounce).
      v.dispatchEvent(new Event("play"));
      v.dispatchEvent(new Event("pause"));
    });

    // Allow the immediate-write path to settle.
    await expect.poll(async () => await readSavedPosition(page), { timeout: 2000 }).toBe(30);

    // Reload — the wrapper should mount-read the saved 30s and render
    // the overlay.
    await page.reload();
    const dialog = page.getByRole("dialog", { name: /resume playback/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("00:30");
  });

  test("WHEN the resume overlay's Resume CTA is clicked THEN the <video> seeks to the saved position", async ({
    page,
    context,
  }) => {
    test.setTimeout(20_000);
    await clearStorageFor(context);
    await seedSavedPosition(context, 30);
    await page.goto(lessonUrl("en"));

    const dialog = page.getByRole("dialog", { name: /resume playback/i });
    await expect(dialog).toBeVisible();

    const video = page.locator("video");
    const resumeCta = page.getByRole("button", { name: /^resume$/i });
    await resumeCta.click();

    // After the wrapper's seek, the <video>.currentTime settles at 30.
    await expect
      .poll(async () => video.evaluate((el) => (el as HTMLVideoElement).currentTime), {
        timeout: 2000,
      })
      .toBe(30);
  });

  test("WHEN a saved position is within the last 10 seconds of the lesson THEN the overlay does NOT render", async ({
    page,
    context,
  }) => {
    await clearStorageFor(context);
    // The overlay is suppressed within the last 10s; sit 5s inside that band.
    await seedSavedPosition(context, DURATION_SECONDS - 5);
    await page.goto(lessonUrl("en"));

    const dialog = page.getByRole("dialog", { name: /resume playback/i });
    await expect(dialog).not.toBeVisible();
  });

  test("WHEN a saved position is below 30 seconds THEN the overlay does NOT render", async ({
    page,
    context,
  }) => {
    await clearStorageFor(context);
    await seedSavedPosition(context, 10);
    await page.goto(lessonUrl("en"));

    const dialog = page.getByRole("dialog", { name: /resume playback/i });
    await expect(dialog).not.toBeVisible();
  });

  test("WHEN the page cold-loads with a saved value THEN the wrapper does NOT overwrite it with 0", async ({
    page,
    context,
  }) => {
    await clearStorageFor(context);
    await seedSavedPosition(context, 180);
    await page.goto(lessonUrl("en"));

    // Wait a beat for any buggy write attempts to surface.
    await page.waitForTimeout(500);
    expect(await readSavedPosition(page)).toBe(180);
  });
});
