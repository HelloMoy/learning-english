import { fireCinemaConfetti } from "@/lib/cinema-confetti/cinema-confetti";

import { describe, expect, test, vi } from "vitest";

import { celebrateLessonCompletion } from "./celebrate-completion";

vi.mock("@/lib/cinema-confetti/cinema-confetti", () => ({
  fireCinemaConfetti: vi.fn().mockResolvedValue(undefined),
}));

describe("celebrateLessonCompletion", () => {
  test("WHEN a lesson is completed THEN the shared confetti burst is fired once", async () => {
    // Act
    await celebrateLessonCompletion();

    // Assert
    expect(fireCinemaConfetti).toHaveBeenCalledTimes(1);
  });
});
