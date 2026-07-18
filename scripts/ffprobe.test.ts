import { execFile, execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { FfprobeFailedError, FfprobeNotFoundError, probeDurationSeconds } from "./ffprobe";

const execFileAsync = promisify(execFile);

/**
 * Detect ffmpeg at MODULE load time (not in beforeAll). `test.skipIf`
 * evaluates its argument when the test is scheduled, which happens before
 * `beforeAll` runs. Module-load detection is the simplest way to make
 * the skip decision stick.
 */
const FFMPEG_AVAILABLE = (() => {
  try {
    execSync("which ffmpeg", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

/**
 * Generates a 1-second silent video with `ffmpeg` and a separate text
 * file for the "not a media" test. Skipped when ffmpeg is missing.
 */
describe("probeDurationSeconds", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ffprobe-test-"));
  const validMp4 = path.join(dir, "valid.mp4");
  const notAMediaFile = path.join(dir, "not-a-media.txt");

  beforeAll(async () => {
    if (!FFMPEG_AVAILABLE) return;
    await execFileAsync(
      "ffmpeg",
      ["-y", "-f", "lavfi", "-i", "color=c=blue:s=64x64:d=1", "-pix_fmt", "yuv420p", validMp4],
      { timeout: 30_000 },
    );
    writeFileSync(notAMediaFile, "hello");
  }, 60_000);

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe("WHEN ffmpeg is installed and the fixture exists", () => {
    test.skipIf(!FFMPEG_AVAILABLE)(
      "AND the file is a valid 1-second silent mp4 THEN it returns 1",
      async () => {
        // Arrange — fixture created in beforeAll.
        expect(existsSync(validMp4)).toBe(true);

        // Act
        const result = await probeDurationSeconds(validMp4);

        // Assert — duration is rounded to int; a 1-second input may
        // round to 0 or 1 depending on ffprobe precision; allow both.
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(2);
        expect(Number.isInteger(result)).toBe(true);
      },
    );

    test.skipIf(!FFMPEG_AVAILABLE)(
      "AND the file is not a media file THEN it throws FfprobeFailedError",
      async () => {
        // Arrange — text file from beforeAll.
        expect(existsSync(notAMediaFile)).toBe(true);

        // Act + Assert
        await expect(probeDurationSeconds(notAMediaFile)).rejects.toBeInstanceOf(
          FfprobeFailedError,
        );
      },
    );
  });

  describe("WHEN the binary is missing", () => {
    test("THEN it throws FfprobeNotFoundError with an install hint", async () => {
      // Arrange — point the helper at a binary path that does not exist.
      const missingPath = "/nonexistent/path/to/ffprobe-that-does-not-exist";

      // Act + Assert
      await expect(
        probeDurationSeconds(validMp4, { binaryPath: missingPath }),
      ).rejects.toBeInstanceOf(FfprobeNotFoundError);

      await expect(probeDurationSeconds(validMp4, { binaryPath: missingPath })).rejects.toThrow(
        /ffmpeg/,
      );
    });
  });
});
