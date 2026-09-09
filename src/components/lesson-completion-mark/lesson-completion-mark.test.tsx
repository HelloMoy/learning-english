import { LessonId } from "@/domain/entities/ids/ids";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, test } from "vitest";

import messages from "../../messages/en.json";
import { LessonCompletionMark } from "./lesson-completion-mark";

const LESSON_DURATION_SECONDS = 600;

const markCompleteInStorage = (lessonId: LessonId): void => {
  window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");
};

const storePosition = (lessonId: LessonId, seconds: number): void => {
  window.localStorage.setItem(`learning-english:playback:${lessonId}`, seconds.toString());
};

/** Both stores cache their snapshot, so seeded storage has to be announced. */
const announceStorageChange = (): void => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

function renderMark({
  lessonId,
  durationSeconds,
}: {
  lessonId: LessonId;
  durationSeconds?: number;
}) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      <LessonCompletionMark
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

describe("LessonCompletionMark", () => {
  describe("GIVEN a lesson the learner has taken", () => {
    test("WHEN it was marked through the button THEN the mark is announced, not merely coloured", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      markCompleteInStorage(lessonId);
      announceStorageChange();

      renderMark({ lessonId, durationSeconds: LESSON_DURATION_SECONDS });

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    test("WHEN it was watched to the end THEN the mark appears without a button press", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, finishThresholdSeconds(LESSON_DURATION_SECONDS));
      announceStorageChange();

      renderMark({ lessonId, durationSeconds: LESSON_DURATION_SECONDS });

      expect(screen.getByTestId("lesson-completion-mark")).toBeInTheDocument();
    });
  });

  describe("GIVEN a lesson the learner has not finished", () => {
    test("WHEN nothing has been watched THEN nothing is rendered", () => {
      // Absence is the neutral state: marks can only appear after hydration,
      // so a "not completed" marker would assert a falsehood in the first frame.
      renderMark({
        lessonId: LessonId.parse(faker.string.uuid()),
        durationSeconds: LESSON_DURATION_SECONDS,
      });

      expect(screen.queryByTestId("lesson-completion-mark")).toBeNull();
    });

    test("WHEN it was watched partway THEN nothing is rendered", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, 240);
      announceStorageChange();

      renderMark({ lessonId, durationSeconds: LESSON_DURATION_SECONDS });

      expect(screen.queryByTestId("lesson-completion-mark")).toBeNull();
    });
  });

  describe("GIVEN a caller that knows no runtime", () => {
    test("WHEN the duration is omitted THEN completion falls back to the mark alone", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, finishThresholdSeconds(LESSON_DURATION_SECONDS));
      announceStorageChange();

      renderMark({ lessonId });

      expect(screen.queryByTestId("lesson-completion-mark")).toBeNull();
    });
  });
});
