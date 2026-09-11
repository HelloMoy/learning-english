import { contentCatalog } from "@/adapters/persistence/content-manifest/content-manifest";
import type { VideoLesson } from "@/domain/entities/lesson/lesson";
import { DEFAULT_SEEK_STEP_SECONDS } from "@/lib/seek-run/seek-run";
import messages from "@/messages/en.json";

import { devices, expect, test, type Locator, type Page } from "@playwright/test";

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
 *   - "A tap pauses the video on a phone" / "A second tap resumes it" (under
 *     iPhone emulation — the gesture path, not YouTube's mobile skin itself)
 *   - "The tap acts while the video fills the viewport"
 *   - "A click on a mouse keeps toggling playback"
 *   - "No tap merely reveals the controls"
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

/** A lesson in a different module, for the rules that are not per-lesson. */
const ANOTHER_MODULE = modulesOfCourse(COURSE_SLUG)[1]!;
const ANOTHER_LESSON = contentCatalog.lessonRows.find(
  (lesson): lesson is VideoLesson =>
    lesson.moduleId === ANOTHER_MODULE.id &&
    lesson.kind === "video" &&
    isYouTubeSourced(lesson.source),
)!;
const ANOTHER_LESSON_URL = `/en/courses/${COURSE_SLUG}/modules/${ANOTHER_MODULE.slug}/lessons/${ANOTHER_LESSON.id}`;

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

/**
 * A spot on the video that no control ever covers: below the top button row,
 * above the compact layout's centre play button. A tap here reaches the
 * provider, which is where the player's gestures listen.
 */
async function spotOnTheVideo(player: Locator) {
  const box = (await player.boundingBox())!;
  return { x: box.width * 0.5, y: box.height * 0.3 };
}

/** Starts playback from the control bar and waits until frames roll. */
async function startPlayback(page: Page, player: Locator) {
  await page.locator(".vds-play-button").click();
  await expect(player).toHaveAttribute("data-playing", "", { timeout: 15_000 });
}

/**
 * The player's own clock, read from the `MediaPlayerInstance` that owns the
 * element. Vidstack answers a `find-media-player` event by calling the
 * function in its detail, which is the supported way to reach the instance
 * from outside React — and the only way to see where a YouTube-sourced video
 * really is, since the embed's own readout is behind a cross-origin frame.
 */
async function currentTimeOf(player: Locator): Promise<number> {
  return player.evaluate((element) => {
    let currentTime = Number.NaN;
    element.dispatchEvent(
      new CustomEvent("find-media-player", {
        detail: (found: { state: { currentTime: number } }) => {
          currentTime = found.state.currentTime;
        },
        bubbles: true,
        composed: true,
      }),
    );
    return currentTime;
  });
}

/**
 * Spots on the video, in page coordinates, for the emulated touchscreen: the
 * right fifth is where a double tap seeks forward, and the middle band is
 * where it toggles fullscreen and a single tap toggles playback. Both sit
 * above the compact layout's centre button row.
 */
async function touchSpotsOn(player: Locator) {
  const box = (await player.boundingBox())!;
  const y = box.y + box.height * 0.3;
  return {
    forwardEdge: { x: box.x + box.width * 0.9, y },
    middle: { x: box.x + box.width * 0.5, y },
  };
}

/** Two taps on the same spot, close enough together to be one double tap. */
async function doubleTap(page: Page, spot: { x: number; y: number }) {
  await page.touchscreen.tap(spot.x, spot.y);
  await page.touchscreen.tap(spot.x, spot.y);
}

/** Matches a label that counts this many seconds — the indicator's, or an option's. */
const countOf = (seconds: number) => new RegExp(`\\b${seconds}\\b`);

const SETTINGS = messages.Components.VideoPlayer.settings;

/**
 * The submenu button's accessible name is its label followed by the hint that
 * names the step in force, so it is matched by the label alone.
 */
const SEEK_STEP_ENTRY = new RegExp(messages.Components.SeekStepMenu.label);

/** Opens the player's settings menu and steps into the seek-step submenu. */
async function openSeekStepMenu(page: Page) {
  await page.getByRole("button", { name: SETTINGS }).click();
  await page.getByRole("menuitem", { name: SEEK_STEP_ENTRY }).click();
}

/**
 * Picks a step the way a learner does — through the gear menu — and closes the
 * menu again, so the next gesture reaches the video rather than the popover.
 */
async function chooseSeekStep(page: Page, seconds: number) {
  await openSeekStepMenu(page);
  await page.getByRole("menuitemradio", { name: countOf(seconds) }).click();
  // Two presses, and the second one matters: the first steps out of the
  // submenu and leaves the settings menu itself open. While any menu is open
  // the player rejects every gesture, so a double click after one press is
  // swallowed — and the radio options are already gone by then, which makes
  // their absence a liar. The button's own `aria-expanded` is the honest
  // signal that the player is listening again.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: SETTINGS })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
}

/** The step the submenu reports as chosen, read from the radio group. */
async function stepShownAsChosen(page: Page, seconds: number) {
  await openSeekStepMenu(page);
  return page.getByRole("menuitemradio", { name: countOf(seconds) });
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

  test("WHEN the chrome renders THEN no gesture only reveals the controls", async ({ page }) => {
    // On a phone the Default Layout's own set turned a tap into show/hide
    // controls, which left YouTube's centre icon dead. The player's set has
    // exactly one single-tap gesture, and it toggles playback.
    const { player } = await openLesson(page);

    await expect(player.locator('.vds-gesture[action="toggle:controls"]')).toHaveCount(0);
    await expect(player.locator('.vds-gesture[action="toggle:paused"]')).toHaveCount(1);
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

  test("WHEN the video is clicked THEN it pauses", async ({ page }) => {
    // The guard that replacing the layout's gesture set kept what a mouse
    // already had: a click on the video toggles playback.
    const { player } = await openLesson(page);
    await startPlayback(page, player);

    await page.locator("[data-media-provider]").click({ position: await spotOnTheVideo(player) });

    await expect(player).toHaveAttribute("data-paused", "");
  });

  test("WHEN the right edge is double-clicked THEN the video seeks and says so", async ({
    page,
  }) => {
    const { player } = await openLesson(page);
    await startPlayback(page, player);
    const before = await currentTimeOf(player);
    const box = (await player.boundingBox())!;

    await page
      .locator("[data-media-provider]")
      .dblclick({ position: { x: box.width * 0.9, y: box.height * 0.3 } });

    await expect(page.getByRole("status")).toHaveAttribute("data-direction", "forward");
    await expect(page.getByRole("status")).toHaveText(countOf(DEFAULT_SEEK_STEP_SECONDS));
    await expect
      .poll(() => currentTimeOf(player))
      .toBeGreaterThanOrEqual(before + DEFAULT_SEEK_STEP_SECONDS - 0.5);
  });

  test("WHEN the settings menu opens THEN the seek step is one of its entries", async ({
    page,
  }) => {
    // The slot the entry is mounted in only exists once the layout has loaded,
    // which jsdom never reaches — this is the only place that wiring is proved.
    await openLesson(page);

    await page.getByRole("button", { name: SETTINGS }).click();

    await expect(page.getByRole("menuitem", { name: SEEK_STEP_ENTRY })).toBeVisible();
    // The hint is its own element; the button's text runs the label straight
    // into it ("Seek step5 seconds"), where no word boundary separates them.
    await expect(
      page.getByRole("menuitem", { name: SEEK_STEP_ENTRY }).locator(".vds-menu-item-hint"),
    ).toHaveText(countOf(DEFAULT_SEEK_STEP_SECONDS));
  });

  test("WHEN nothing was ever chosen THEN the default step is the checked option", async ({
    page,
  }) => {
    await openLesson(page);

    const option = await stepShownAsChosen(page, DEFAULT_SEEK_STEP_SECONDS);

    await expect(option).toHaveAttribute("aria-checked", "true");
  });

  test("WHEN a longer step is chosen THEN a double click seeks by that step", async ({ page }) => {
    const CHOSEN = 10;
    const { player } = await openLesson(page);
    await startPlayback(page, player);
    await chooseSeekStep(page, CHOSEN);
    const before = await currentTimeOf(player);
    const box = (await player.boundingBox())!;

    await page
      .locator("[data-media-provider]")
      .dblclick({ position: { x: box.width * 0.9, y: box.height * 0.3 } });

    await expect(page.getByRole("status")).toHaveText(countOf(CHOSEN));
    await expect.poll(() => currentTimeOf(player)).toBeGreaterThanOrEqual(before + CHOSEN - 0.5);
  });

  test("WHEN a step is chosen THEN a reload finds it still chosen", async ({ page }) => {
    const CHOSEN = 10;
    await openLesson(page);
    await chooseSeekStep(page, CHOSEN);

    await page.reload();
    await expect(page.locator("[data-media-player]")).toBeVisible();

    await expect(await stepShownAsChosen(page, CHOSEN)).toHaveAttribute("aria-checked", "true");
  });

  test("WHEN a step is chosen THEN another lesson is governed by it too", async ({ page }) => {
    // The preference is the learner's, not the lesson's — its storage key
    // carries no lesson id.
    const CHOSEN = 10;
    await openLesson(page);
    await chooseSeekStep(page, CHOSEN);

    await page.goto(ANOTHER_LESSON_URL);
    await expect(page.locator("[data-media-player]")).toBeVisible();

    await expect(await stepShownAsChosen(page, CHOSEN)).toHaveAttribute("aria-checked", "true");
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
    await startPlayback(page, player);

    // Buffering can outlast the bar's auto-hide. A tap on the video brings
    // the bar back — and, by design, pauses — so playback is resumed from the
    // bar, which stays up long enough to reach the enlarge control.
    await player.tap({ position: await spotOnTheVideo(player) });
    await expect(player).toHaveAttribute("data-paused", "");
    await startPlayback(page, player);
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

  test("WHEN the video is tapped THEN it pauses, and a second tap resumes it", async ({ page }) => {
    // Safari on iPhone shows YouTube's own centre play/pause icon through the
    // chrome, and the provider's blocker keeps every tap from reaching it. The
    // tap has to do what that icon promises — not, as the Default Layout had
    // it on a touch device, merely show or hide the control bar.
    const { player } = await openLesson(page);
    await revealControls(page);
    await startPlayback(page, player);
    const spot = await spotOnTheVideo(player);

    await page.locator("[data-media-provider]").tap({ position: spot });
    await expect(player).toHaveAttribute("data-paused", "");
    await expect(page.locator("[data-media-player] .vds-controls")).toHaveAttribute(
      "data-visible",
      "",
    );

    await page.locator("[data-media-provider]").tap({ position: spot });
    await expect(player).toHaveAttribute("data-playing", "", { timeout: 15_000 });
  });

  test("WHEN the video is enlarged THEN a tap still toggles playback", async ({ page }) => {
    // Enlarged and in landscape is where the report came from: the box is
    // wide enough for the large layout, which has no centre play button of
    // its own, so YouTube's is the only one on screen.
    const { player } = await openLesson(page);
    await revealControls(page);
    await page.getByRole("button", { name: ENTER_FULLSCREEN }).click();
    await startPlayback(page, player);

    await page.locator("[data-media-provider]").tap({ position: await spotOnTheVideo(player) });

    await expect(player).toHaveAttribute("data-paused", "");
  });

  test("WHEN the right edge is double-tapped THEN the video seeks one step and says so", async ({
    page,
  }) => {
    const { player } = await openLesson(page);
    await revealControls(page);
    await startPlayback(page, player);
    const before = await currentTimeOf(player);
    const { forwardEdge } = await touchSpotsOn(player);

    await doubleTap(page, forwardEdge);

    await expect(page.getByRole("status")).toHaveAttribute("data-direction", "forward");
    await expect(page.getByRole("status")).toHaveText(countOf(DEFAULT_SEEK_STEP_SECONDS));
    await expect
      .poll(() => currentTimeOf(player))
      .toBeGreaterThanOrEqual(before + DEFAULT_SEEK_STEP_SECONDS - 0.5);
  });

  test("WHEN a third tap follows THEN another step is added", async ({ page }) => {
    // The library resets its press counter after a double tap; left to it,
    // this tap would be a single one and pause the video 250 ms later.
    const { player } = await openLesson(page);
    await revealControls(page);
    await startPlayback(page, player);
    const before = await currentTimeOf(player);
    const { forwardEdge } = await touchSpotsOn(player);
    await doubleTap(page, forwardEdge);
    await expect(page.getByRole("status")).toHaveText(countOf(DEFAULT_SEEK_STEP_SECONDS));

    await page.touchscreen.tap(forwardEdge.x, forwardEdge.y);

    await expect(page.getByRole("status")).toHaveText(countOf(2 * DEFAULT_SEEK_STEP_SECONDS));
    await expect
      .poll(() => currentTimeOf(player))
      .toBeGreaterThanOrEqual(before + 2 * DEFAULT_SEEK_STEP_SECONDS - 0.5);
    await expect(player).toHaveAttribute("data-playing", "");
  });

  test("WHEN the settings menu opens THEN the seek step is reachable from the small layout", async ({
    page,
  }) => {
    // The phone gets the small layout, whose settings menu is a sheet rather
    // than a popover — a different code path in the library to the desktop's.
    await openLesson(page);
    await revealControls(page);

    await page.getByRole("button", { name: SETTINGS }).click();

    await expect(page.getByRole("menuitem", { name: SEEK_STEP_ENTRY })).toBeVisible();
  });

  test("WHEN a longer step is chosen THEN the double tap seeks by that step", async ({ page }) => {
    const CHOSEN = 10;
    const { player } = await openLesson(page);
    await revealControls(page);
    await chooseSeekStep(page, CHOSEN);
    await startPlayback(page, player);
    const before = await currentTimeOf(player);
    const { forwardEdge } = await touchSpotsOn(player);

    await doubleTap(page, forwardEdge);

    await expect(page.getByRole("status")).toHaveText(countOf(CHOSEN));
    await expect.poll(() => currentTimeOf(player)).toBeGreaterThanOrEqual(before + CHOSEN - 0.5);
  });

  test("WHEN the middle is tapped during a run THEN the video keeps playing", async ({ page }) => {
    const { player } = await openLesson(page);
    await revealControls(page);
    await startPlayback(page, player);
    const { forwardEdge, middle } = await touchSpotsOn(player);
    await doubleTap(page, forwardEdge);
    await expect(page.getByRole("status")).toBeVisible();

    await page.touchscreen.tap(middle.x, middle.y);

    // The run lapsing is the deterministic point after which a pause, had the
    // tap caused one, would already show on the player.
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(player).toHaveAttribute("data-playing", "");
  });

  test("WHEN the run has ended THEN a tap pauses again", async ({ page }) => {
    const { player } = await openLesson(page);
    await revealControls(page);
    await startPlayback(page, player);
    const { forwardEdge, middle } = await touchSpotsOn(player);
    await doubleTap(page, forwardEdge);
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);

    await page.touchscreen.tap(middle.x, middle.y);

    await expect(player).toHaveAttribute("data-paused", "");
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
