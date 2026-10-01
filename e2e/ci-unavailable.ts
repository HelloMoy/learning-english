import { test } from "@playwright/test";

/**
 * Skips a block that cannot pass on a CI runner, saying why.
 *
 * @remarks
 * The reason is a property of the environment, not a defect in the
 * application.
 *
 * `"youtube"` — the player never reports frames rolling, so anything waiting on
 * playback times out. Whether that is Playwright's bundled Chromium lacking the
 * proprietary codecs or YouTube declining a datacenter address, no change to
 * the app affects it. Every lesson is served by YouTube, so this covers any
 * block that waits on a video to become ready or to play.
 *
 * Every skip runs normally outside CI, where YouTube plays, so nothing is lost
 * locally — which is the point of gating on `CI` rather than deleting.
 *
 * @example
 * ```ts
 * test.describe("GIVEN a browser that can take the player fullscreen", () => {
 *   skipOnCi("youtube");
 *   // …
 * });
 * ```
 *
 * @param reason - Which environment limit applies
 */
export function skipOnCi(reason: "youtube"): void {
  const because: Record<typeof reason, string> = {
    youtube: "a YouTube embed does not play on a CI runner",
  };
  test.skip(!!process.env.CI, because[reason]);
}
