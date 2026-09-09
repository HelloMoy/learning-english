import { LessonId } from "@/domain/entities/ids/ids";
import type { LessonRuntime } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, test } from "vitest";

import messages from "../../messages/en.json";
import { ModuleWatchProgress } from "./module-watch-progress";

const LESSON_DURATION_SECONDS = 600;

const runtimes = (count: number): LessonRuntime[] =>
  Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(`55555555-5555-4555-8555-${String(index).padStart(12, "0")}`),
    durationSeconds: LESSON_DURATION_SECONDS,
  }));

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

function renderProgress(lessonRuntimes: LessonRuntime[]) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      <ModuleWatchProgress lessonRuntimes={lessonRuntimes} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("ModuleWatchProgress", () => {
  describe("GIVEN a module the learner has not started", () => {
    test("WHEN it renders THEN no meter is drawn", () => {
      renderProgress(runtimes(17));

      expect(screen.queryByRole("progressbar")).toBeNull();
    });
  });

  describe("GIVEN a module the learner is part way through", () => {
    test("WHEN it renders THEN the meter counts completions against the module's lessons", () => {
      const lessons = runtimes(17);
      for (const lesson of lessons.slice(0, 7)) markCompleteInStorage(lesson.id);
      announceStorageChange();

      renderProgress(lessons);

      const meter = screen.getByRole("progressbar", { name: "7 of 17 videos completed" });
      expect(meter).toHaveAttribute("aria-valuenow", "7");
      expect(meter).toHaveAttribute("aria-valuemax", "17");
      expect(screen.getByText("7 / 17 videos")).toBeInTheDocument();
    });

    test("WHEN a lesson beyond the card's preview is complete THEN it still counts", () => {
      // The gallery previews six lessons; the meter counts all seventeen.
      const lessons = runtimes(17);
      markCompleteInStorage(lessons[16]!.id);
      announceStorageChange();

      renderProgress(lessons);

      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    });
  });

  describe("GIVEN a module the learner has finished", () => {
    test("WHEN it renders THEN it says so rather than leaving two equal numbers to be read", () => {
      const lessons = runtimes(3);
      for (const lesson of lessons) markCompleteInStorage(lesson.id);
      announceStorageChange();

      renderProgress(lessons);

      expect(screen.getByText("Lesson completed")).toBeInTheDocument();
      expect(screen.getByRole("progressbar", { name: "All 3 videos completed" })).toHaveAttribute(
        "aria-valuenow",
        "3",
      );
    });
  });

  describe("GIVEN a module holding no lessons", () => {
    test("WHEN it renders THEN no meter is drawn and nothing is divided by zero", () => {
      renderProgress([]);

      expect(screen.queryByRole("progressbar")).toBeNull();
    });
  });
});
