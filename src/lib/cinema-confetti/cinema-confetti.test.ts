import { beforeEach, describe, expect, test, vi } from "vitest";

import { fireCinemaConfetti } from "./cinema-confetti";

const confetti = vi.hoisted(() => vi.fn());

vi.mock("canvas-confetti", () => ({ default: confetti }));

describe("fireCinemaConfetti", () => {
  beforeEach(() => {
    confetti.mockReset();
    confetti.mockResolvedValue(undefined);
  });

  test("WHEN a celebration is fired THEN a burst leaves each bottom corner", async () => {
    // Act
    await fireCinemaConfetti();

    // Assert
    const origins = confetti.mock.calls.map(([options]) => options.origin);
    expect(origins).toEqual([
      { x: 0, y: 0.9 },
      { x: 1, y: 0.9 },
    ]);
  });

  test("WHEN confetti is fired THEN it stands down for a reduced-motion learner", async () => {
    // Act
    await fireCinemaConfetti();

    // Assert — the preference is the library's to honour; re-implementing
    // the media query here would define it twice.
    for (const [options] of confetti.mock.calls) {
      expect(options).toMatchObject({ disableForReducedMotion: true });
    }
  });

  test("WHEN the burst throws THEN the caller is not dragged down with it", async () => {
    // Arrange — decoration over an action that already succeeded.
    confetti.mockImplementation(() => {
      throw new Error("no canvas in this environment");
    });

    // Act & Assert
    await expect(fireCinemaConfetti()).resolves.toBeUndefined();
  });

  test("WHEN the burst rejects THEN the caller is not dragged down with it", async () => {
    // Arrange
    confetti.mockRejectedValue(new Error("draw failed"));

    // Act & Assert
    await expect(fireCinemaConfetti()).resolves.toBeUndefined();
  });
});
