import { LessonId } from "@/domain/entities/ids/ids";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, test } from "vitest";

import messages from "../../messages/en.json";
import { LessonWatchProgress } from "./lesson-watch-progress";

const LESSON_DURATION_SECONDS = 600;

const storePosition = (lessonId: LessonId, seconds: number): void => {
  window.localStorage.setItem(`learning-english:playback:${lessonId}`, seconds.toString());
};

const markCompleteInStorage = (lessonId: LessonId): void => {
  window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");
};

/** Both stores cache their snapshot, so seeded storage has to be announced. */
const announceStorageChange = (): void => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

function renderProgress({
  lessonId,
  durationSeconds = LESSON_DURATION_SECONDS,
}: {
  lessonId: LessonId;
  durationSeconds?: number;
}) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      <LessonWatchProgress
        lessonId={lessonId}
        durationSeconds={durationSeconds}
      />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("LessonWatchProgress", () => {
  describe("GIVEN a lesson the learner has never opened", () => {
    test("WHEN it renders THEN nothing is drawn, not even an empty bar", () => {
      // An empty bar in the pre-hydration frame would assert the learner has
      // watched nothing, which may well be false.
      renderProgress({ lessonId: LessonId.parse(faker.string.uuid()) });

      expect(screen.queryByRole("progressbar")).toBeNull();
    });
  });

  describe("GIVEN a lesson watched partway", () => {
    test("WHEN it renders THEN the bar reports how far the learner got", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, 240);
      announceStorageChange();

      renderProgress({ lessonId });

      const bar = screen.getByRole("progressbar", { name: "40% watched" });
      expect(bar).toHaveAttribute("aria-valuenow", "40");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(screen.getByText("40%")).toBeInTheDocument();
    });
  });

  describe("GIVEN a lesson the learner has finished", () => {
    test("WHEN it was watched to the end THEN the bar reads full", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, finishThresholdSeconds(LESSON_DURATION_SECONDS));
      announceStorageChange();

      renderProgress({ lessonId });

      // "Finished" and "nearly finished" must not be drawn identically.
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    });

    test("WHEN it was marked through the button THEN the bar reads full", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      markCompleteInStorage(lessonId);
      announceStorageChange();

      renderProgress({ lessonId });

      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    });
  });

  describe("GIVEN a lesson with no runtime", () => {
    test("WHEN it renders THEN no bar is drawn", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, 240);
      announceStorageChange();

      renderProgress({ lessonId, durationSeconds: 0 });

      expect(screen.queryByRole("progressbar")).toBeNull();
    });
  });
});
