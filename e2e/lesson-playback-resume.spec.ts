import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import type { VideoLesson } from "@/domain/entities/lesson/lesson";

import {
  devices,
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";

import { modulesOfCourse } from "./content-seed-fixtures";

/**
 * Device emulation minus `defaultBrowserType`, which Playwright refuses inside
 * a `describe` because it would force a new worker. The project selects the
 * engine; the non-WebKit ones skip.
 */
function deviceWithoutEngine(device: (typeof devices)[string]) {
  const emulation: Record<string, unknown> = { ...device };
  delete emulation.defaultBrowserType;
  return emulation;
}

/**
 * E2E tests for the playback-position resume cycle (capability:
 * `playback-position`).
 *
 * Fixtures come from the generated content seed, which is the whole
 * catalog. `course-catalog.spec.ts` resolves its fixtures the same way.
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
 * **This is the only layer that can prove the feature.** The player is
 * Vidstack, and jsdom loads no media provider — component tests can deliver
 * events but never observe a seek or a play. So the assertions that matter
 * live here: that the overlay waits for a play, that it sits inside the
 * player, that every answer leaves the video playing from the right second,
 * and that the page behind it stays usable.
 *
 * Spec coverage:
 *   - "Landing on the lesson shows nothing until play" (R5)
 *   - "The first play opens the overlay inside the player" (R5)
 *   - "Resume seeks and plays" / "Restart plays from the top" (R5)
 *   - "The overlay is offered at most once per mount" (R5)
 *   - The three negative threshold cases (R5)
 *   - "Escape restarts and plays" + the stored position surviving (R7)
 *   - "First user interaction is required before the first write" (R4)
 */

const COURSE_SLUG = "advanced-intermediate-course";
const MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
const LESSON = contentCatalog.lessonRows
  .filter(
    (lesson): lesson is VideoLesson => lesson.moduleId === MODULE.id && lesson.kind === "video",
  )
  .sort((a, b) => b.durationSeconds - a.durationSeconds)[0]!;
const LESSON_ID = LESSON.id;
const DURATION_SECONDS = LESSON.durationSeconds;
const STORAGE_KEY = `learning-english:playback:${LESSON_ID}`;

const RESUMABLE_SECONDS = 30;

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
async function clearStorageFor(context: BrowserContext) {
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

async function seedSavedPosition(context: BrowserContext, seconds: number) {
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

async function readSavedPosition(page: Page): Promise<number | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, STORAGE_KEY);
}

const playerRegion = (page: Page): Locator => page.getByRole("region", { name: /video player/i });

const resumeOverlay = (page: Page): Locator =>
  page.getByRole("dialog", { name: /resume playback/i });

/** The `<video>` the provider renders, for reading `currentTime` and `paused`. */
const videoElement = (page: Page): Locator => playerRegion(page).locator("video");

/**
 * Opens the lesson and waits until the player is ready to accept a play.
 *
 * Vidstack defers loading behind an `IntersectionObserver`, so a click landing
 * before `can-play` would be swallowed and the test would look flaky rather
 * than failing on its actual assertion.
 */
async function openLesson(page: Page, locale = "en") {
  await page.goto(lessonUrl(locale));
  await expect(playerRegion(page)).toBeVisible();
  await expect
    .poll(async () => videoElement(page).evaluate((el) => (el as HTMLVideoElement).readyState), {
      timeout: 15_000,
    })
    .toBeGreaterThan(0);
}

/**
 * Presses play through the layout's own button.
 *
 * The hover is what reveals the controls — while the video is idle they are
 * present but only painted on interaction.
 */
async function pressPlay(page: Page) {
  await playerRegion(page).hover();
  await page.getByRole("button", { name: /^play$/i }).click();
}

/**
 * Pauses by clicking the video surface — the layout's own tap-to-toggle
 * gesture.
 *
 * Once playback starts the Default Layout drops its controls out of the
 * accessibility tree, so there is no Pause button left to click, and WebKit
 * does not deliver the `k` shortcut to the focused player. The click lands in
 * the upper third, clear of the control bar's hit area.
 */
async function pressPause(page: Page) {
  const box = (await playerRegion(page).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 4);
}

/**
 * Which of the page's own elements are hidden from assistive technology.
 *
 * The app paints a decorative, permanently `aria-hidden` cinema backdrop, so
 * the count is never zero — what matters is that opening the overlay does not
 * *change* it, the way a modal's backdrop would.
 */
const ariaHiddenCount = (page: Page) => page.locator("body > [aria-hidden='true']").count();

const isPaused = (page: Page) =>
  videoElement(page).evaluate((el) => (el as HTMLVideoElement).paused);

const currentTime = (page: Page) =>
  videoElement(page).evaluate((el) => (el as HTMLVideoElement).currentTime);

test.describe("Lesson playback-position resume cycle", () => {
  test.describe("GIVEN a resumable position is stored", () => {
    test.beforeEach(async ({ context }) => {
      await clearStorageFor(context);
      await seedSavedPosition(context, RESUMABLE_SECONDS);
    });

    test("WHEN the learner lands on the lesson THEN no resume surface appears anywhere", async ({
      page,
    }) => {
      await openLesson(page);

      // The prompt used to fire on mount, over the whole page, before the
      // learner had asked for anything. It must now wait for a play.
      await expect(resumeOverlay(page)).toHaveCount(0);
      await expect(page.getByText(/resume from/i)).toHaveCount(0);
    });

    test("WHEN the learner presses play THEN the overlay opens inside the player and playback holds", async ({
      page,
    }) => {
      await openLesson(page);
      await pressPlay(page);

      const overlay = resumeOverlay(page);
      await expect(overlay).toBeVisible();
      await expect(overlay).toContainText("00:30");
      await expect.poll(() => isPaused(page)).toBe(true);

      // The overlay is bounded by the player, not by the viewport — that is
      // the whole point of moving it out of a modal.
      const overlayBox = (await overlay.boundingBox())!;
      const playerBox = (await playerRegion(page).boundingBox())!;
      expect(overlayBox.x).toBeGreaterThanOrEqual(playerBox.x - 1);
      expect(overlayBox.y).toBeGreaterThanOrEqual(playerBox.y - 1);
      expect(overlayBox.x + overlayBox.width).toBeLessThanOrEqual(
        playerBox.x + playerBox.width + 1,
      );
      expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(
        playerBox.y + playerBox.height + 1,
      );
    });

    test("WHEN the overlay is open THEN the rest of the page stays live", async ({ page }) => {
      await openLesson(page);
      const hiddenBefore = await ariaHiddenCount(page);

      await pressPlay(page);
      await expect(resumeOverlay(page)).toBeVisible();

      // A modal would hide the page behind it and cover it with a backdrop.
      // This one hides nothing new and leaves the page reachable.
      expect(await ariaHiddenCount(page)).toBe(hiddenBefore);
      await expect(page.getByRole("heading", { name: LESSON.title })).toBeVisible();
      await expect(page.getByRole("button", { name: /mark as complete/i })).toBeEnabled();
    });

    test("WHEN the learner chooses Resume THEN the video seeks to the saved position and plays", async ({
      page,
    }) => {
      await openLesson(page);
      await pressPlay(page);
      await expect(resumeOverlay(page)).toBeVisible();

      await page.getByRole("button", { name: /^resume$/i }).click();

      await expect(resumeOverlay(page)).toHaveCount(0);
      await expect.poll(() => currentTime(page)).toBeGreaterThanOrEqual(RESUMABLE_SECONDS);
      await expect.poll(() => isPaused(page)).toBe(false);
    });

    test("WHEN the learner chooses Restart THEN the video plays from the top", async ({ page }) => {
      await openLesson(page);
      await pressPlay(page);
      await expect(resumeOverlay(page)).toBeVisible();

      await page.getByRole("button", { name: /restart from beginning/i }).click();

      await expect(resumeOverlay(page)).toHaveCount(0);
      await expect.poll(() => isPaused(page)).toBe(false);
      expect(await currentTime(page)).toBeLessThan(RESUMABLE_SECONDS);
    });

    test("WHEN the learner dismisses with Escape THEN the video plays from the top", async ({
      page,
    }) => {
      await openLesson(page);
      await pressPlay(page);
      await expect(resumeOverlay(page)).toBeVisible();

      await page.keyboard.press("Escape");

      // Dismissal is restart: the learner asked to watch, and the only open
      // question was where from. The stored position is then overwritten by
      // the ordinary write cadence, because the top of the lesson is now
      // genuinely where they are.
      await expect(resumeOverlay(page)).toHaveCount(0);
      await expect.poll(() => isPaused(page)).toBe(false);
      expect(await currentTime(page)).toBeLessThan(RESUMABLE_SECONDS);
    });

    test("WHEN the learner plays again after answering THEN the overlay does not return", async ({
      page,
    }) => {
      await openLesson(page);
      await pressPlay(page);
      await page.getByRole("button", { name: /restart from beginning/i }).click();
      await expect(resumeOverlay(page)).toHaveCount(0);

      await pressPause(page);
      await expect.poll(() => isPaused(page)).toBe(true);
      await pressPlay(page);

      await expect.poll(() => isPaused(page)).toBe(false);
      await expect(resumeOverlay(page)).toHaveCount(0);
    });

    test("WHEN the page cold-loads THEN the stored position is not overwritten with 0", async ({
      page,
    }) => {
      await openLesson(page);
      await page.waitForTimeout(500);

      expect(await readSavedPosition(page)).toBe(RESUMABLE_SECONDS);
    });
  });

  test.describe("GIVEN a position not worth resuming", () => {
    const cases: [name: string, seconds: number | null][] = [
      ["nothing has been saved", null],
      ["the learner barely started", 10],
      ["the learner effectively finished", DURATION_SECONDS - 5],
    ];

    for (const [name, seconds] of cases) {
      test(`WHEN ${name} THEN pressing play starts the video with no overlay`, async ({
        page,
        context,
      }) => {
        await clearStorageFor(context);
        if (seconds !== null) await seedSavedPosition(context, seconds);

        await openLesson(page);
        await pressPlay(page);

        await expect.poll(() => isPaused(page)).toBe(false);
        await expect(resumeOverlay(page)).toHaveCount(0);
      });
    }
  });

  test.describe("GIVEN the learner watches and leaves", () => {
    test("WHEN they play then pause THEN the position is written for the next visit", async ({
      page,
      context,
    }) => {
      await clearStorageFor(context);
      await openLesson(page);

      await pressPlay(page);
      await expect.poll(() => isPaused(page)).toBe(false);
      await expect.poll(() => currentTime(page), { timeout: 10_000 }).toBeGreaterThan(0);
      await pressPause(page);

      await expect.poll(async () => await readSavedPosition(page)).not.toBeNull();
    });
  });
});

/**
 * The same cycle, on a lesson served by YouTube.
 *
 * @remarks
 * The suite above drives an `HTMLVideoElement`, so it only ever exercised the
 * self-hosted provider — which is how a bug that killed resume on every Basic
 * Course lesson shipped green. Answering the overlay left the YouTube provider
 * buffering forever: it had been paused while its initial play request was
 * still in flight, and from there it ignored every seek and play. See
 * `openspec/changes/fix-youtube-resume-stuck-buffering/design.md`.
 *
 * A YouTube lesson has no `<video>` to read, so playback is observed through
 * the player's own `data-*` state — the same surface
 * `hosted-lesson-playback.spec.ts` asserts on.
 */
const YOUTUBE_COURSE_SLUG = "basic-course";

const YOUTUBE_LESSON = contentCatalog.lessonRows
  .filter(
    (lesson): lesson is VideoLesson =>
      lesson.kind === "video" && /^https?:/.test(lesson.source) && lesson.durationSeconds > 120,
  )
  .sort((a, b) => b.durationSeconds - a.durationSeconds)[0]!;

const YOUTUBE_MODULE = modulesOfCourse(YOUTUBE_COURSE_SLUG).find(
  (courseModule) => courseModule.id === YOUTUBE_LESSON.moduleId,
)!;

const YOUTUBE_STORAGE_KEY = `learning-english:playback:${YOUTUBE_LESSON.id}`;

/** Comfortably past the 30s floor, and far from the end of any lecture. */
const YOUTUBE_RESUMABLE_SECONDS = 60;

/** Where the seeded position sits on the seek slider's 0-100 scale. */
const seededPercent = (YOUTUBE_RESUMABLE_SECONDS / YOUTUBE_LESSON.durationSeconds) * 100;

/** Whether the player reports frames actually rolling. */
const isPlaying = (page: Page): Promise<boolean> =>
  playerRegion(page).evaluate((element) => element.hasAttribute("data-playing"));

/**
 * How far through the lesson the player is, as a percentage.
 *
 * The seek slider publishes it as `aria-valuenow`, which is the only place a
 * YouTube lesson exposes its position to the page — there is no `<video>` to
 * read `currentTime` from.
 */
const percentWatched = (page: Page): Promise<number> =>
  playerRegion(page)
    .locator('[role="slider"][aria-label*="Seek" i]')
    .evaluate((element) => Number.parseFloat(element.getAttribute("aria-valuenow") ?? "0"));

test.describe("Lesson playback-position resume cycle, on a YouTube lesson", () => {
  test("WHEN the learner resumes THEN the video plays on past the saved position", async ({
    page,
    context,
  }) => {
    await clearStorageFor(context);
    await context.addInitScript(
      ([key, value]) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // ignore
        }
      },
      [YOUTUBE_STORAGE_KEY, String(YOUTUBE_RESUMABLE_SECONDS)],
    );

    await page.goto(
      `/en/courses/${YOUTUBE_COURSE_SLUG}/modules/${YOUTUBE_MODULE.slug}/lessons/${YOUTUBE_LESSON.id}`,
    );
    await expect(playerRegion(page)).toBeVisible();
    await expect
      .poll(async () => playerRegion(page).getAttribute("data-can-play"), {
        timeout: 30_000,
      })
      .not.toBeNull();

    await pressPlay(page);
    await expect(resumeOverlay(page)).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /^resume/i }).click();

    // Before the fix the player settled on buffering at 0s and stayed there
    // for good — no reload, no recovery, on either answer.
    await expect.poll(() => isPlaying(page), { timeout: 30_000 }).toBe(true);
    await expect
      .poll(() => percentWatched(page), { timeout: 30_000 })
      .toBeGreaterThan(seededPercent);
  });
});

/**
 * The overlay is bounded by the player, and on a phone the player is a 16:9
 * box barely 200px tall. A card laid out for a desktop column overflows it at
 * both ends, where the lesson wrapper's `overflow: hidden` clips it — the
 * learner is offered a choice whose heading and first line are gone.
 *
 * Spec coverage: "The resume overlay stays fully readable inside the player at
 * every viewport" (capability `playback-position`).
 */
test.describe("The resume overlay on a phone", () => {
  test.use(deviceWithoutEngine(devices["iPhone 13"]));
  test.skip(({ browserName }) => browserName !== "webkit", "phone Safari is WebKit");

  for (const width of [390, 320]) {
    test(`WHEN the overlay opens at ${width}px THEN the card lies inside the player`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width, height: 664 });
      await clearStorageFor(context);
      await seedSavedPosition(context, RESUMABLE_SECONDS);

      await page.goto(lessonUrl("en"));
      await expect(playerRegion(page)).toBeVisible();
      await expect
        .poll(async () => playerRegion(page).getAttribute("data-can-play"), { timeout: 30_000 })
        .not.toBeNull();
      await pressPlay(page);
      await expect(resumeOverlay(page)).toBeVisible({ timeout: 30_000 });

      // The dialog element is the full-player backdrop; the card inside it is
      // what overflows, so that is what has to be measured.
      const player = (await playerRegion(page).boundingBox())!;
      const card = (await resumeOverlay(page).locator(":scope > div").boundingBox())!;

      expect(card.y).toBeGreaterThanOrEqual(player.y);
      expect(card.y + card.height).toBeLessThanOrEqual(player.y + player.height);
    });
  }
});
