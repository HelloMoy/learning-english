import { beforeEach, describe, expect, test, vi } from "vitest";

import { celebrateLessonCompletion } from "./celebrate-completion";

const confetti = vi.hoisted(() => vi.fn());

vi.mock("canvas-confetti", () => ({ default: confetti }));

describe("celebrateLessonCompletion", () => {
  beforeEach(() => {
    confetti.mockReset();
    confetti.mockResolvedValue(undefined);
  });

  test("WHEN a lesson is completed THEN confetti is fired", async () => {
    // Act
    await celebrateLessonCompletion();

    // Assert
    expect(confetti).toHaveBeenCalled();
  });

  test("WHEN confetti is fired THEN it stands down for a reduced-motion learner", async () => {
    // Act
    await celebrateLessonCompletion();

    // Assert — the preference is the library's to honour; re-implementing
    // the media query here would define it twice.
    for (const [options] of confetti.mock.calls) {
      expect(options).toMatchObject({ disableForReducedMotion: true });
    }
  });

  test("WHEN the burst throws THEN the caller is not dragged down with it", async () => {
    // Arrange — decoration over an action that already succeeded: the
    // lesson is recorded whether or not anything is drawn.
    confetti.mockImplementation(() => {
      throw new Error("no canvas in this environment");
    });

    // Act & Assert
    await expect(celebrateLessonCompletion()).resolves.toBeUndefined();
  });

  test("WHEN the burst rejects THEN the caller is not dragged down with it", async () => {
    // Arrange
    confetti.mockRejectedValue(new Error("draw failed"));

    // Act & Assert
    await expect(celebrateLessonCompletion()).resolves.toBeUndefined();
  });
});
