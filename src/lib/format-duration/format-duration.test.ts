import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it.each([
    // [seconds, hours, minutes, why this case matters]
    [0, 0, 0, "an empty module reports zero rather than a blank label"],
    [59, 0, 1, "any non-zero duration rounds up to at least one minute"],
    [1680, 0, 28, "module 1 — under an hour stays minutes-only"],
    [3600, 1, 0, "exactly one hour carries no minute remainder"],
    [3630, 1, 1, "just over the hour boundary rounds to the nearest minute"],
    [38100, 10, 35, "module 10 — 635 minutes reads as hours, not a minute count"],
  ])("turns %i seconds into %ih %im (%s)", (seconds, hours, minutes) => {
    expect(formatDuration(seconds)).toEqual({ hours, minutes });
  });

  it("never reports 60 minutes instead of rolling into the next hour", () => {
    // 59m30s rounds to 60 minutes; a naive implementation would emit
    // `{ hours: 0, minutes: 60 }`, which renders as "60 min".
    expect(formatDuration(3570)).toEqual({ hours: 1, minutes: 0 });
  });

  it("treats negative input as zero rather than emitting a negative label", () => {
    expect(formatDuration(-30)).toEqual({ hours: 0, minutes: 0 });
  });
});
