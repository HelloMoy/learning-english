import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UpNextCard } from "./up-next-card";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "course",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 1,
  moduleCount: 1,
});
const currentModule = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "current-module",
  title: "Current Module",
  sequence: 1,
});
const nextModule = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "next-module",
  title: "Next Module",
  sequence: 2,
});

describe("UpNextCard", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN nextLesson is non-null THEN it renders a link with the next lesson's title", () => {
    // Arrange
    const next = Lesson.parse({
      kind: "reading",
      id: LessonId.parse(faker.string.uuid()),
      courseId: course.id,
      moduleId: nextModule.id,
      sequence: 1,
      title: "Next lesson title",
      body: "body",
    });

    // Act
    render(
      <UpNextCard
        course={course}
        nextLesson={next}
        nextLessonModule={nextModule}
      />,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link.textContent).toBe("Next lesson title");
  });

  test("WHEN nextLesson belongs to a different module THEN the link uses that module's slug", () => {
    // Arrange — cross-module scenario: next lesson's moduleId differs from
    // the current module's id. The link must use the next module's slug,
    // not the current one's.
    const next = Lesson.parse({
      kind: "video",
      id: LessonId.parse(faker.string.uuid()),
      courseId: course.id,
      moduleId: nextModule.id,
      sequence: 1,
      title: "Cross-module lesson",
      description: "desc",
      source: faker.internet.url(),
      durationSeconds: 600,
    });

    // Act
    render(
      <UpNextCard
        course={course}
        nextLesson={next}
        nextLessonModule={nextModule}
      />,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain(`/modules/${nextModule.slug}/`);
    expect(link.getAttribute("href")).not.toContain(`/modules/${currentModule.slug}/`);
  });

  test("WHEN nextLesson is null THEN it renders the 'course completed' message", () => {
    // Act
    render(
      <UpNextCard
        course={course}
        nextLesson={null}
        nextLessonModule={null}
      />,
    );

    // Assert
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("courseCompleted")).toBeInTheDocument();
  });
});
