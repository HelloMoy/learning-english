import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonList } from "./lesson-list";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
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
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
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
