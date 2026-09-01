import { describe, expect, test } from "vitest";

import { formatMinutesSeconds } from "./format-minutes-seconds";

describe("formatMinutesSeconds", () => {
  test("pads both halves to two digits", () => {
    expect(formatMinutesSeconds(65)).toBe("01:05");
  });

  test("renders a whole ten-minute lesson", () => {
    expect(formatMinutesSeconds(600)).toBe("10:00");
  });

  test("truncates fractional seconds rather than rounding up past the end", () => {
    // A `<video>` reports `currentTime` as a float. Rounding 599.9 of a
    // 600-second lesson to 10:00 would claim it finished.
    expect(formatMinutesSeconds(599.9)).toBe("09:59");
  });

  test("counts past an hour in minutes, not hours", () => {
    // Playback clocks read MM:SS; the hour split is `formatDuration`'s job
    // and belongs to catalogue copy, not to a scrubber.
    expect(formatMinutesSeconds(3661)).toBe("61:01");
  });

  test("treats zero as the start", () => {
    expect(formatMinutesSeconds(0)).toBe("00:00");
  });

  test("treats a negative input as the start rather than rendering a minus", () => {
    expect(formatMinutesSeconds(-5)).toBe("00:00");
  });
});
