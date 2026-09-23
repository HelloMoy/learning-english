import { test } from "@playwright/test";

/**
 * Skips a block that cannot pass on a CI runner, saying which of the two
 * reasons applies.
 *
 * @remarks
 * Both reasons are properties of the environment, not defects in the
 * application, and both are temporary.
 *
 * `"youtube"` — the player never reports frames rolling, so anything waiting on
 * playback times out. Whether that is Playwright's bundled Chromium lacking the
 * proprietary codecs or YouTube declining a datacenter address, no change to
 * the app affects it.
 *
 * `"self-hosted-content"` — the Advanced Intermediate Course sources its video
 * from `.mp4` files under the content tree. `.gitignore` excludes video for
 * every course by design, so a CI checkout has the seed's metadata but none of
 * the bytes, and any assertion that fetches an asset or renders from one fails.
 * This disappears when that course moves to YouTube sources, which is planned:
 * its thumbnails, PDFs and markdown are 21 MB and will be committed, and only
 * the 15 GB of video stays out.
 *
 * Every skip runs normally outside CI, where both hold, so nothing is lost
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
export function skipOnCi(reason: "youtube" | "self-hosted-content"): void {
  const because =
    reason === "youtube"
      ? "a YouTube embed does not play on a CI runner"
      : "the Advanced Intermediate Course's video is gitignored, so CI has no content to render";
  test.skip(!!process.env.CI, because);
}
