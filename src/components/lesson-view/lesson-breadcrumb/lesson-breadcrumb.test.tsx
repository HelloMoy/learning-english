import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonBreadcrumb } from "./lesson-breadcrumb";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const fixtures = () => {
  const courseId = CourseId.parse(faker.string.uuid());
  const moduleId = ModuleId.parse(faker.string.uuid());
  const course = Course.parse({
    id: courseId,
    slug: "my-course",
    title: "My Course",
    description: "desc",
    language: "en",
    lessonCount: 1,
    moduleCount: 1,
    sequence: 1,
  });
  const courseModule = Module.parse({
    id: moduleId,
    courseId,
    slug: "my-module",
    title: "My Module",
    sequence: 1,
  });
  const lesson = Lesson.parse({
    kind: "reading",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId,
    sequence: 1,
    title: "My Lesson",
    body: "Body",
  });
  return { course, module: courseModule, lesson };
};

describe("LessonBreadcrumb", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN it shows three segments in order with locale-aware overview links", () => {
    // Arrange
    const { course, module: courseModule, lesson } = fixtures();

    // Act
    render(
      <LessonBreadcrumb
        course={course}
        module={courseModule}
        lesson={lesson}
      />,
    );

    // Assert
    expect(screen.getByText(course.title)).toBeInTheDocument();
    expect(screen.getByText(courseModule.title)).toBeInTheDocument();
    expect(screen.getByText(lesson.title)).toBeInTheDocument();
    const courseLink = screen.getByRole("link", { name: course.title });
    const moduleLink = screen.getByRole("link", { name: courseModule.title });
    expect(courseLink).toHaveAttribute("href", "/courses/my-course");
    expect(moduleLink).toHaveAttribute("href", "/courses/my-course/modules/my-module");
  });

  test("WHEN rendered THEN the current lesson has aria-current=page", () => {
    // Arrange
    const { course, module: courseModule, lesson } = fixtures();

    // Act
    const { container } = render(
      <LessonBreadcrumb
        course={course}
        module={courseModule}
        lesson={lesson}
      />,
    );

    // Assert
    const current = container.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe(lesson.title);
  });
});
