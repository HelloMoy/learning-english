import { Course } from "@/domain/entities/course/course";
import { LessonId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  ModuleLesson,
  ModuleSummary,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import { faker } from "@faker-js/faker";
import { act, render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonProgressPanel } from "./lesson-progress-panel";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: vi.fn(),
}));

const COMPLETED_KEY_PREFIX = "learning-english:completed:";
const PLAYBACK_KEY_PREFIX = "learning-english:playback:";

const msg = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

const course = Course.parse({
  id: faker.string.uuid(),
  slug: "course-1",
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 25,
  moduleCount: 5,
  sequence: 1,
});

const panelModule = Module.parse({
  id: faker.string.uuid(),
  courseId: course.id,
  slug: "3-consonants",
  title: faker.lorem.words(2),
  sequence: 3,
});

const MODULE_HREF = "/courses/course-1/modules/3-consonants";
const lessonHref = (lesson: ModuleLesson) => `${MODULE_HREF}/lessons/${lesson.id}`;

const summaryOf = (count: number): ModuleSummary => {
  const lessons = Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence: index + 1,
    title: faker.lorem.words(3),
    durationSeconds: 600,
  }));
  return {
    moduleId: panelModule.id,
    lessonCount: count,
    totalDurationSeconds: count * 600,
    lessons,
  };
};

const announceStorageChange = () => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

const markComplete = (lessons: ReadonlyArray<ModuleLesson>) => {
  for (const lesson of lessons) {
    window.localStorage.setItem(`${COMPLETED_KEY_PREFIX}${lesson.id}`, "1");
  }
};

const renderPanel = (summary: ModuleSummary) => {
  render(
    <LessonProgressPanel
      course={course}
      module={panelModule}
      summary={summary}
    />,
  );
  announceStorageChange();
  return screen.getByTestId("lesson-progress-panel");
};

describe("LessonProgressPanel", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
    vi.mocked(useIsHydrated).mockReturnValue(true);
    window.localStorage.clear();
    announceStorageChange();
  });

  describe("GIVEN the page has not hydrated", () => {
    test("WHEN the panel renders THEN it names the module AND offers only Open lesson", () => {
      // Arrange
      vi.mocked(useIsHydrated).mockReturnValue(false);
      const summary = summaryOf(25);

      // Act
      const panel = renderPanel(summary);

      // Assert
      expect(panel).toHaveTextContent(panelModule.title);
      const links = within(panel).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", MODULE_HREF);
      expect(panel).not.toHaveTextContent("startThisLesson");
      expect(panel).not.toHaveTextContent("keepGoing");
    });
  });

  describe("GIVEN a module the learner has not started", () => {
    test("WHEN the panel renders THEN it counts the videos ready AND Start this lesson opens the first video", () => {
      // Arrange
      const summary = summaryOf(25);

      // Act
      const panel = renderPanel(summary);

      // Assert
      expect(panel).toHaveAttribute("data-state", "not-started");
      expect(panel).toHaveTextContent(msg("videosReady", { count: 25 }));
      expect(within(panel).getByRole("link", { name: "startThisLesson" })).toHaveAttribute(
        "href",
        lessonHref(summary.lessons[0]!),
      );
    });

    test("WHEN the panel renders THEN up next lists the three videos after the first", () => {
      // Arrange
      const summary = summaryOf(25);

      // Act
      const panel = renderPanel(summary);

      // Assert
      const upNext = within(panel).getByRole("list", { name: "upNext" });
      expect(
        within(upNext)
          .getAllByRole("listitem")
          .map((item) => item.textContent),
      ).toEqual(summary.lessons.slice(1, 4).map((lesson) => expect.stringContaining(lesson.title)));
    });
  });

  describe("GIVEN three videos complete AND the fourth part-watched", () => {
    test("WHEN the panel renders THEN it offers to continue the fourth video with its progress", () => {
      // Arrange
      const summary = summaryOf(25);
      markComplete(summary.lessons.slice(0, 3));
      window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${summary.lessons[3]!.id}`, "240");

      // Act
      const panel = renderPanel(summary);

      // Assert
      expect(panel).toHaveAttribute("data-state", "in-progress");
      expect(panel).toHaveTextContent(msg("percentComplete", { percent: 0.12 }));
      expect(panel).toHaveTextContent(msg("completedOfTotal", { completed: 3, total: 25 }));
      expect(panel).toHaveTextContent(msg("pickUp", { title: summary.lessons[3]!.title }));
      expect(panel).toHaveTextContent(msg("videoOfTotal", { number: 4, total: 25 }));
      expect(within(panel).getByRole("link", { name: "continueWatching" })).toHaveAttribute(
        "href",
        lessonHref(summary.lessons[3]!),
      );
      expect(within(panel).getByRole("link", { name: "openLesson" })).toHaveAttribute(
        "href",
        MODULE_HREF,
      );
    });
  });

  describe("GIVEN only the last video unfinished", () => {
    test("WHEN the panel renders THEN no up next list is shown", () => {
      // Arrange
      const summary = summaryOf(4);
      markComplete(summary.lessons.slice(0, 3));

      // Act
      const panel = renderPanel(summary);

      // Assert
      expect(within(panel).queryByRole("list", { name: "upNext" })).toBeNull();
    });
  });

  describe("GIVEN every video complete", () => {
    test("WHEN the panel renders THEN it offers to watch again from the first video AND to open the lesson", () => {
      // Arrange
      const summary = summaryOf(5);
      markComplete(summary.lessons);

      // Act
      const panel = renderPanel(summary);

      // Assert
      expect(panel).toHaveAttribute("data-state", "completed");
      expect(panel).toHaveTextContent(msg("allWatched", { count: 5 }));
      expect(within(panel).getByRole("link", { name: "watchAgain" })).toHaveAttribute(
        "href",
        lessonHref(summary.lessons[0]!),
      );
      expect(within(panel).getByRole("link", { name: "openLesson" })).toHaveAttribute(
        "href",
        MODULE_HREF,
      );
    });
  });
});
