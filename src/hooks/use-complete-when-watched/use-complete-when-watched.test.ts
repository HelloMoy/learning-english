import { LessonId } from "@/domain/entities/ids/ids";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useCompleteWhenWatched, type WatchedPlayer } from "./use-complete-when-watched";

vi.mock("@/hooks/use-lesson-completion/use-lesson-completion", () => ({
  markLessonComplete: vi.fn(async () => {}),
}));

const celebrate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/celebrate-completion/celebrate-completion", () => ({
  celebrateLessonCompletion: celebrate,
}));

const { markLessonComplete } = await import("@/hooks/use-lesson-completion/use-lesson-completion");

const LESSON_DURATION_SECONDS = 600;

/** A player whose clock the test moves by hand. */
function makePlayer(
  seconds: number,
  duration = LESSON_DURATION_SECONDS,
): WatchedPlayer & {
  currentTime: number;
} {
  return { currentTime: seconds, duration };
}

function renderAutoCompletion({
  player,
  durationSeconds = LESSON_DURATION_SECONDS,
  lessonId = LessonId.parse(faker.string.uuid()),
}: {
  player: WatchedPlayer;
  durationSeconds?: number;
  lessonId?: LessonId;
}) {
  const view = renderHook(() => useCompleteWhenWatched({ lessonId, durationSeconds, player }));
  return { ...view, lessonId };
}

/** Lets the hook's async write settle after the event that triggered it. */
const flushWrites = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

beforeEach(() => {
  vi.mocked(markLessonComplete).mockClear();
});

describe("useCompleteWhenWatched", () => {
  describe("GIVEN playback has not begun", () => {
    test("WHEN the stored position is already past the threshold THEN nothing is written", async () => {
      // Merely opening a finished lesson must not write. The lesson already
      // *reads* as complete from its position; a write here would claim the
      // learner did something they did not.
      const player = makePlayer(finishThresholdSeconds(LESSON_DURATION_SECONDS) + 5);
      const { result } = renderAutoCompletion({ player });

      act(() => {
        result.current.handleProgress();
      });
      await flushWrites();

      expect(markLessonComplete).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the learner is playing the lesson", () => {
    test("WHEN playback crosses the finish threshold THEN the lesson is marked complete", async () => {
      const player = makePlayer(0);
      const { result, lessonId } = renderAutoCompletion({ player });

      act(() => {
        result.current.handlePlaybackStarted();
        player.currentTime = finishThresholdSeconds(LESSON_DURATION_SECONDS);
        result.current.handleProgress();
      });
      await flushWrites();

      expect(markLessonComplete).toHaveBeenCalledWith(lessonId);
    });

    test("WHEN progress keeps arriving past the threshold THEN the mark is written once", async () => {
      const player = makePlayer(0);
      const { result } = renderAutoCompletion({ player });

      act(() => {
        result.current.handlePlaybackStarted();
        for (let seconds = 560; seconds <= 600; seconds += 5) {
          player.currentTime = seconds;
          result.current.handleProgress();
        }
      });
      await flushWrites();

      expect(markLessonComplete).toHaveBeenCalledTimes(1);
    });

    test("WHEN the learner stops short of the threshold THEN nothing is written", async () => {
      const player = makePlayer(0);
      const { result } = renderAutoCompletion({ player });

      act(() => {
        result.current.handlePlaybackStarted();
        player.currentTime = finishThresholdSeconds(LESSON_DURATION_SECONDS) - 1;
        result.current.handleProgress();
      });
      await flushWrites();

      expect(markLessonComplete).not.toHaveBeenCalled();
    });

    test("WHEN an arbitrary position past the threshold is reached THEN the lesson is marked", async () => {
      const player = makePlayer(0);
      const { result, lessonId } = renderAutoCompletion({ player });

      act(() => {
        result.current.handlePlaybackStarted();
        player.currentTime = faker.number.int({
          min: Math.ceil(finishThresholdSeconds(LESSON_DURATION_SECONDS)),
          max: LESSON_DURATION_SECONDS,
        });
        result.current.handleProgress();
      });
      await flushWrites();

      expect(markLessonComplete).toHaveBeenCalledWith(lessonId);
    });
  });

  describe("GIVEN a lesson whose metadata carries no runtime", () => {
    test("WHEN the provider reports one THEN the threshold uses it", async () => {
      const player = makePlayer(0, 300);
      const { result, lessonId } = renderAutoCompletion({ player, durationSeconds: 0 });

      act(() => {
        result.current.handlePlaybackStarted();
        player.currentTime = 300;
        result.current.handleProgress();
      });
      await flushWrites();

      expect(markLessonComplete).toHaveBeenCalledWith(lessonId);
    });

    test("WHEN neither the metadata nor the provider knows the runtime THEN nothing is written", async () => {
      const player = makePlayer(0, 0);
      const { result } = renderAutoCompletion({ player, durationSeconds: 0 });

      act(() => {
        result.current.handlePlaybackStarted();
        player.currentTime = 9999;
        result.current.handleProgress();
      });
      await flushWrites();

      expect(markLessonComplete).not.toHaveBeenCalled();
    });
  });
});

describe("useCompleteWhenWatched — celebrating the finish", () => {
  beforeEach(() => {
    celebrate.mockReset();
  });

  test("WHEN playback crosses the finish threshold THEN the lesson is celebrated", () => {
    // Arrange
    const player = makePlayer(0);
    const { result } = renderAutoCompletion({ player });

    // Act
    act(() => {
      result.current.handlePlaybackStarted();
      player.currentTime = finishThresholdSeconds(LESSON_DURATION_SECONDS) + 1;
      result.current.handleProgress();
    });

    // Assert — the same burst the manual control fires: to the learner it
    // is the same moment.
    expect(celebrate).toHaveBeenCalledTimes(1);
  });

  test("WHEN playback continues past the threshold THEN it is celebrated once", () => {
    // Arrange — `time-update` fires several times a second; the last
    // seconds of a lesson must not fire fifty bursts.
    const player = makePlayer(0);
    const { result } = renderAutoCompletion({ player });

    // Act
    act(() => {
      result.current.handlePlaybackStarted();
      player.currentTime = finishThresholdSeconds(LESSON_DURATION_SECONDS) + 1;
      result.current.handleProgress();
      player.currentTime += 2;
      result.current.handleProgress();
      player.currentTime += 2;
      result.current.handleProgress();
    });

    // Assert
    expect(celebrate).toHaveBeenCalledTimes(1);
  });

  test("WHEN a lesson is opened past the threshold without playing THEN nothing is celebrated", () => {
    // Arrange — a stored position past the threshold fires `time-update` on
    // open; the learner has finished nothing on this visit.
    const player = makePlayer(finishThresholdSeconds(LESSON_DURATION_SECONDS) + 5);
    const { result } = renderAutoCompletion({ player });

    // Act
    act(() => {
      result.current.handleProgress();
    });

    // Assert
    expect(celebrate).not.toHaveBeenCalled();
  });
});
