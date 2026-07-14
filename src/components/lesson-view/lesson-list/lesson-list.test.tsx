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
