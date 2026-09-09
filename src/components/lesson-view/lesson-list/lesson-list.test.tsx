import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonList } from "./lesson-list";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  // The progress bar formats its percentage through next-intl rather than
  // concatenating a string, so the mock has to answer for the formatter too.
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const courseId = CourseId.parse(faker.string.uuid());
const moduleId = ModuleId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "course",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 3,
  moduleCount: 1,
  sequence: 1,
});
const courseModule = Module.parse({
  id: moduleId,
  courseId,
  slug: "module",
  title: "Module",
  sequence: 1,
});
const makeLesson = (sequence: number, title: string) =>
  Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence,
    title,
    body: "body",
  });

const VIDEO_DURATION_SECONDS = 600;

const makeVideoLesson = (sequence: number, title: string) =>
  Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence,
    title,
    description: title,
    source: "/local-filesystem-lesson/lesson.mp4",
    durationSeconds: VIDEO_DURATION_SECONDS,
  });

describe("LessonList", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN lessons are listed in sequence order, each a link", () => {
    // Arrange
    const lessons = [makeLesson(1, "First"), makeLesson(2, "Second"), makeLesson(3, "Third")];
    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    // Assert
    const list = container.querySelector("ul");
    if (!list) throw new Error("expected <ul>");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  test("WHEN the current lesson is in the list THEN it carries aria-current=page", () => {
    // Arrange
    const lessons = [makeLesson(1, "First"), makeLesson(2, "Second")];

    // Act
    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[1]!.id}
      />,
    );

    // Assert
    const current = container.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe("Second");
  });
});

describe("LessonList — completion indicator", () => {
  const STORAGE_KEY_PREFIX = "learning-english:completed:";

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    window.localStorage.clear();
    act(() => {
      refreshSavedPlaybackPositions();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
  });

  test("WHEN a lesson has been completed THEN its row shows the indicator", () => {
    // Arrange
    const lessons = [makeLesson(1, "First"), makeLesson(2, "Second")];
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessons[1]!.id}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    // Act
    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    // Assert — exactly one mark, on the completed row.
    const marks = container.querySelectorAll('[data-testid="lesson-completion-mark"]');
    expect(marks).toHaveLength(1);
    const items = within(container.querySelector("ul")!).getAllByRole("listitem");
    expect(items[1]!.querySelector('[data-testid="lesson-completion-mark"]')).not.toBeNull();
  });

  test("WHEN a video was watched to its end THEN its row shows the indicator", () => {
    // The outline reads the same completion rule as the module overview: a
    // lesson finished by watching is done, button or no button.
    const lessons = [makeVideoLesson(1, "First"), makeVideoLesson(2, "Second")];
    window.localStorage.setItem(
      `learning-english:playback:${lessons[1]!.id}`,
      String(finishThresholdSeconds(VIDEO_DURATION_SECONDS)),
    );
    act(() => {
      refreshSavedPlaybackPositions();
    });

    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    const items = within(container.querySelector("ul")!).getAllByRole("listitem");
    expect(items[1]!.querySelector('[data-testid="lesson-completion-mark"]')).not.toBeNull();
    expect(items[0]!.querySelector('[data-testid="lesson-completion-mark"]')).toBeNull();
  });

  test("WHEN no lesson has been completed THEN no marker of any kind is rendered", () => {
    // Arrange — the absence matters: an explicit "not completed" marker would
    // assert something false in the pre-hydration frame.
    const lessons = [makeLesson(1, "First"), makeLesson(2, "Second")];

    // Act
    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    // Assert
    expect(container.querySelectorAll('[data-testid="lesson-completion-mark"]')).toHaveLength(0);
  });

  test("WHEN the current lesson is also complete THEN both markers coexist", () => {
    // Arrange
    const lessons = [makeLesson(1, "First"), makeLesson(2, "Second")];
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessons[0]!.id}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    // Act
    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    // Assert — the completion mark does not displace aria-current.
    const current = container.querySelector('[aria-current="page"]');
    expect(current).not.toBeNull();
    const items = within(container.querySelector("ul")!).getAllByRole("listitem");
    expect(items[0]!.querySelector('[data-testid="lesson-completion-mark"]')).not.toBeNull();
  });

  test("WHEN the indicator renders THEN it carries a localized accessible name", () => {
    // Arrange
    const lessons = [makeLesson(1, "First")];
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessons[0]!.id}`, "1");
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    // Act
    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    // Assert — meaning is carried by text, not by colour or the icon alone.
    const mark = container.querySelector('[data-testid="lesson-completion-mark"]');
    expect(mark?.textContent).toContain("completed");
    expect(mark?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("LessonList — watch progress", () => {
  const PLAYBACK_KEY_PREFIX = "learning-english:playback:";

  const announceStorageChange = () => {
    act(() => {
      refreshSavedPlaybackPositions();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
  };

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    window.localStorage.clear();
    announceStorageChange();
  });

  test("WHEN a lesson has been partly watched THEN its row shows how far the learner got", () => {
    const lessons = [makeVideoLesson(1, "First"), makeVideoLesson(2, "Second")];
    window.localStorage.setItem(
      `${PLAYBACK_KEY_PREFIX}${lessons[1]!.id}`,
      String(VIDEO_DURATION_SECONDS * 0.4),
    );
    announceStorageChange();

    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    const items = within(container.querySelector("ul")!).getAllByRole("listitem");
    expect(items[1]!.querySelector('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "40");
    expect(items[0]!.querySelector('[role="progressbar"]')).toBeNull();
  });

  test("WHEN a lesson is complete THEN its row's bar reads full", () => {
    const lessons = [makeVideoLesson(1, "First")];
    window.localStorage.setItem(
      `${PLAYBACK_KEY_PREFIX}${lessons[0]!.id}`,
      String(finishThresholdSeconds(VIDEO_DURATION_SECONDS)),
    );
    announceStorageChange();

    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    expect(container.querySelector('[role="progressbar"]')).toHaveAttribute("aria-valuenow", "100");
  });

  test("WHEN nothing has been watched THEN no bar is drawn at all", () => {
    // An empty bar in the pre-hydration frame would assert the learner has
    // watched nothing, which may well be false.
    const lessons = [makeVideoLesson(1, "First"), makeVideoLesson(2, "Second")];

    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });

  test("WHEN the lesson is a reading lesson THEN its row carries no bar", () => {
    const lessons = [makeLesson(1, "Reading")];
    window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${lessons[0]!.id}`, "120");
    announceStorageChange();

    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
  });

  test("WHEN a row shows a bar THEN the link keeps its name and stays the row's only tab stop", () => {
    // 214 rows on the largest module: a bar folded into the link would rename
    // every one of them and a focusable bar would double the tab stops.
    const lessons = [makeVideoLesson(1, "First")];
    window.localStorage.setItem(`${PLAYBACK_KEY_PREFIX}${lessons[0]!.id}`, "120");
    announceStorageChange();

    const { container } = render(
      <LessonList
        course={course}
        module={courseModule}
        lessons={lessons}
        currentLessonId={lessons[0]!.id}
      />,
    );

    const item = within(container.querySelector("ul")!).getAllByRole("listitem")[0]!;
    expect(within(item).getByRole("link").textContent).toBe("First");
    expect(item.querySelectorAll("a, button, [tabindex='0']")).toHaveLength(1);
    expect(item.querySelector('[role="progressbar"]')).not.toHaveAttribute("tabindex");
  });
});
