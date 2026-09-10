import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import type { VideoLesson } from "@/domain/entities/lesson/lesson";
import messages from "@/messages/en.json";

import { devices, expect, test, type Page } from "@playwright/test";

import { modulesOfCourse } from "./content-seed-fixtures";

/**
 * iPhone emulation minus `defaultBrowserType`, which Playwright refuses inside
 * a `describe` because it would force a new worker. The engine comes from the
 * project instead, and the non-WebKit ones skip.
 */
function deviceWithoutEngine(device: (typeof devices)[string]) {
  const emulation: Record<string, unknown> = { ...device };
  delete emulation.defaultBrowserType;
  return emulation;
}

const IPHONE = deviceWithoutEngine(devices["iPhone 13"]);

/**
 * E2E tests for the Player's box and its enlarge control (capability:
 * `lesson-page`).
 *
 * **This is the only layer that can prove either of them.** The Default Layout
 * renders no controls under jsdom — the player defers loading behind an
 * `IntersectionObserver` that never fires there — so the `fullscreenButton`
 * slot never mounts and the enlarge control is unreachable in a component
 * test. The embed `<iframe>` is not created at all. Both facts need a browser
 * that really lays the player out.
 *
 * What these tests cannot reach is the engine where the bug was found. WebKit
 * for iOS sizes an ancestor from an in-flow element that overflows a clipping
 * box; desktop WebKit and Chromium clip it correctly, so the symptom does not
 * reproduce here. The guard is therefore written against the **mechanism** —
 * the embed frame is out of flow — which is engine-independent and true or
 * false in any browser. The symptom itself is verified by hand on the iOS
 * Simulator.
 *
 * Spec coverage:
 *   - "The oversized embed frame is not laid out in flow"
 *   - "The player leaves no empty space above the lesson body on iOS Safari"
 *     (its measurable half — the wrapper is bounded by the player's box)
 *   - "The enlarge control is present on iPhone Safari" (its engine-independent
 *     half — the control exists and is operable)
 *   - "Enlarging pins the player to the viewport"
 *   - "Enlarging does not interrupt playback" (the element is never replaced)
 *   - "Escape leaves the mode"
 */

const COURSE_SLUG = "basic-course";
const MODULE = modulesOfCourse(COURSE_SLUG)[0]!;
const LESSON = contentCatalog.lessonRows.find(
  (lesson): lesson is VideoLesson =>
    lesson.moduleId === MODULE.id && lesson.kind === "video" && isYouTubeSourced(lesson.source),
)!;

const ENTER_FULLSCREEN = messages.Components.VideoPlayer["enter-fullscreen"];
const EXIT_FULLSCREEN = messages.Components.VideoPlayer["exit-fullscreen"];

/** The borders the lesson layout draws around the player, top and bottom. */
const WRAPPER_BORDER_PX = 2;

function isYouTubeSourced(source: string): boolean {
  return /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)/.test(new URL(source).hostname);
}

const LESSON_URL = `/en/courses/${COURSE_SLUG}/modules/${MODULE.slug}/lessons/${LESSON.id}`;

/**
 * Opens the lesson and waits for the provider to build its embed frame. The
 * player loads on visibility, so nothing about the frame is true until then.
 */
async function openLesson(page: Page) {
  await page.goto(LESSON_URL);
  const player = page.locator("[data-media-player]");
  await expect(player).toBeVisible();
  const embedFrame = page.locator("[data-media-provider] iframe.vds-youtube");
  await expect(embedFrame).toBeAttached();
  return { player, embedFrame };
}

/**
 * Brings the control bar into view, the only way a learner can.
 *
 * The compact layout keeps the bottom bar `visibility: hidden` until
 * playback has started, and then auto-hides it about two seconds later. So
 * the video is played, then paused — a paused player keeps its controls up,
 * which is the one stable state to assert against.
 */
async function revealControls(page: Page) {
  await expect(page.locator("[data-media-player] .vds-controls")).toBeAttached({
    timeout: 15_000,
  });
  const playPause = page.locator(".vds-play-button");

  await playPause.tap();
  await expect(page.locator("[data-media-player][data-started]")).toBeAttached({
    timeout: 15_000,
  });
  await playPause.tap();

  await expect(page.getByRole("button", { name: ENTER_FULLSCREEN })).toBeVisible();
}

test.describe("GIVEN a YouTube-sourced lesson", () => {
  test("WHEN the provider builds its embed frame THEN that frame is out of the layout flow", async ({
    page,
  }) => {
    // Vidstack stretches the frame to `height: 1000%` to push YouTube's own
    // chrome outside the visible band. In flow, WebKit for iOS grows the
    // lesson's wrapper from that overflow even though the provider clips it,
    // which is what buried the lesson body under a black slab.
    const { embedFrame } = await openLesson(page);

    const position = await embedFrame.evaluate((frame) => getComputedStyle(frame).position);

    expect(position).toBe("absolute");
  });

  test("WHEN the frame is oversized THEN its centre sits on the visible band's centre", async ({
    page,
  }) => {
    // Only the middle band of the frame is ever on screen, and the embed lays
    // its video out around the frame's own centre — so the two centres must
    // agree or the learner watches a slice of the video with the embed's own
    // chrome drifting into view. Asserting the centres rather than the offset
    // keeps this true whatever arithmetic the stylesheet uses to get there.
    const { embedFrame } = await openLesson(page);
    const provider = page.locator("[data-media-provider]");

    const frame = (await embedFrame.boundingBox())!;
    const band = (await provider.boundingBox())!;

    const frameCentre = frame.y + frame.height / 2;
    const bandCentre = band.y + band.height / 2;
    expect(Math.abs(frameCentre - bandCentre)).toBeLessThanOrEqual(1);
  });

  test("WHEN the lesson renders THEN the wrapper is no taller than the player's own box", async ({
    page,
  }) => {
    const { player, embedFrame } = await openLesson(page);

    const frameHeight = (await embedFrame.boundingBox())!.height;
    const playerHeight = (await player.boundingBox())!.height;
    const wrapperHeight = (await player.locator("xpath=..").boundingBox())!.height;

    // The frame really is the oversized one — otherwise the assertion below
    // would pass for the wrong reason.
    expect(frameHeight).toBeGreaterThan(playerHeight * 2);
    expect(wrapperHeight).toBeLessThanOrEqual(playerHeight + WRAPPER_BORDER_PX);
  });
});

test.describe("GIVEN a browser that can take the player fullscreen", () => {
  test("WHEN the chrome renders THEN the browser's own control is what is offered", async ({
    page,
  }) => {
    // The page behaves exactly as it did before the fallback existed: the
    // library's button is the affordance, and ours renders nothing at all.
    await openLesson(page);

    await expect(page.locator(".vds-fullscreen-button")).toBeVisible();
    await expect(page.getByRole("button", { name: ENTER_FULLSCREEN })).toHaveCount(0);
  });
});

test.describe("GIVEN Safari on an iPhone", () => {
  // WebKit under iPhone emulation is the condition the bug was reported on:
  // `document.fullscreenEnabled` is undefined, so Vidstack marks its own
  // button unsupported and hides it. Desktop WebKit does *not* reproduce this
  // — it reports fullscreen support like Chromium and Firefox — which is why
  // the device descriptor is what selects this branch, not the engine alone.
  test.use(IPHONE);
  test.skip(({ browserName }) => browserName !== "webkit", "iPhone Safari is WebKit");

  test("WHEN the chrome renders THEN the fallback stands in for the hidden button", async ({
    page,
  }) => {
    await openLesson(page);

    await revealControls(page);

    await expect(page.locator(".vds-fullscreen-button")).toBeHidden();
  });

  test("WHEN the lesson renders THEN the wrapper is still bounded by the player's box", async ({
    page,
  }) => {
    // The same assertion as on desktop, at the viewport the slab was reported
    // on. It cannot fail here for the reported reason — this engine clips the
    // overflow correctly — but it pins the geometry the fix depends on.
    const { player } = await openLesson(page);

    const playerHeight = (await player.boundingBox())!.height;
    const wrapperHeight = (await player.locator("xpath=..").boundingBox())!.height;

    expect(wrapperHeight).toBeLessThanOrEqual(playerHeight + WRAPPER_BORDER_PX);
  });

  test("WHEN the control is pressed THEN the player fills the viewport and the page stays free to scroll", async ({
    page,
  }) => {
    // Safari on iPhone hides its toolbar only for a real scroll gesture on the
    // document, and that gesture passes through the pinned player to the page
    // beneath — a scroll lock here is what kept the enlarged video wedged
    // under the toolbar. The page is covered by the backdrop, so nothing of
    // that scrolling shows.
    const { player } = await openLesson(page);
    const viewport = page.viewportSize()!;
    await revealControls(page);

    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();

    const enlarged = (await player.boundingBox())!;
    expect(enlarged.width).toBeGreaterThan(viewport.width * 0.9);
    await expect(page.getByRole("button", { name: EXIT_FULLSCREEN })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    const offsetWhenEnlarged = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 200));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(offsetWhenEnlarged);
  });

  test("WHEN the mode is left THEN the page is back where it was", async ({ page }) => {
    // Without a lock, a swipe made to hide the toolbar moves the page under
    // the pinned player. Back in the page, the player has to be where the
    // learner left it, not under the sticky header.
    await openLesson(page);
    await revealControls(page);
    const offsetAtEntry = await page.evaluate(() => window.scrollY);

    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.getByRole("button", { name: EXIT_FULLSCREEN }).click();

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(offsetAtEntry);
  });

  test("WHEN entering and leaving the mode THEN the player element is never replaced", async ({
    page,
  }) => {
    // Portalling the player into a fullscreen container would remount the
    // provider `<iframe>`, reloading the embed and resetting `currentTime`
    // under the resume overlay and the position writes. Node identity is what
    // makes that regression fail here rather than in a learner's lesson.
    const { player } = await openLesson(page);
    await revealControls(page);
    const playerOnLoad = await player.elementHandle();

    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();
    const playerWhileEnlarged = await player.elementHandle();
    await page.getByRole("button", { name: EXIT_FULLSCREEN }).click();
    const playerBackInPage = await player.elementHandle();

    expect(await playerWhileEnlarged!.evaluate((node, other) => node === other, playerOnLoad)).toBe(
      true,
    );
    expect(await playerBackInPage!.evaluate((node, other) => node === other, playerOnLoad)).toBe(
      true,
    );
  });

  test("WHEN the mode is entered mid-playback THEN the video keeps rolling", async ({ page }) => {
    // Element identity says the subtree was not rebuilt; this says the learner
    // did not notice. Escape is the way out here because a playing player
    // hides its controls after a couple of seconds, and the point of the test
    // is the playback, not the button.
    const { player } = await openLesson(page);
    await revealControls(page);

    await page.locator(".vds-play-button").click();
    await expect(player).toHaveAttribute("data-playing", "", { timeout: 15_000 });

    await player.tap({ position: { x: 8, y: 8 } });
    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();
    await expect(player).toHaveAttribute("data-playing", "");

    await page.keyboard.press("Escape");
    await expect(player).toHaveAttribute("data-playing", "");
  });

  test("WHEN Escape is pressed THEN the video returns to the page", async ({ page }) => {
    const { player } = await openLesson(page);
    await revealControls(page);

    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("button", { name: ENTER_FULLSCREEN })).toBeVisible();
    await expect(player).toHaveCSS("position", "relative");
  });
});

test.describe("GIVEN an iPhone held in landscape with Safari's toolbar on screen", () => {
  // Playwright cannot draw Safari's toolbar, but it can emulate what the page
  // measures: touch input, a landscape viewport, and a `screen` whose short
  // side is taller than that viewport — 292 of 402 points, as measured on iOS
  // 26.5 with the toolbar up. iOS keeps `screen` in portrait terms whatever
  // the orientation, so the emulated screen does too.
  test.use({
    ...IPHONE,
    viewport: { width: 874, height: 292 },
    contextOptions: { screen: { width: 402, height: 874 } },
  });
  test.skip(({ browserName }) => browserName !== "webkit", "iPhone Safari is WebKit");

  const SCROLL_HINT = messages.Components.ScrollDownHint.message;
  const DISMISS_HINT = messages.Components.ScrollDownHint.dismiss;

  test("WHEN the video is enlarged THEN the learner is asked to scroll", async ({ page }) => {
    await openLesson(page);
    await revealControls(page);
    await expect(page.getByRole("status")).toHaveCount(0);

    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();

    await expect(page.getByRole("status")).toContainText(SCROLL_HINT);
  });

  test("WHEN the viewport reaches the screen's short side THEN the hint leaves on its own", async ({
    page,
  }) => {
    // What a swipe that hides the toolbar does to the viewport, minus the
    // toolbar: the layout viewport grows to the full 402 points.
    await openLesson(page);
    await revealControls(page);
    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();
    await expect(page.getByRole("status")).toContainText(SCROLL_HINT);

    await page.setViewportSize({ width: 874, height: 402 });

    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("WHEN the hint is dismissed THEN it stays away", async ({ page }) => {
    await openLesson(page);
    await revealControls(page);
    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();
    await expect(page.getByRole("status")).toContainText(SCROLL_HINT);

    await page.getByRole("button", { name: DISMISS_HINT }).click();

    await expect(page.getByRole("status")).toHaveCount(0);
  });
});
