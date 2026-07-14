import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleList } from "./module-list";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const courseId = CourseId.parse(faker.string.uuid());
const course = Course.parse({
  id: courseId,
  slug: "course",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 1,
  moduleCount: 1,
});
const modA = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "module-a",
  title: "Module A",
  sequence: 1,
});
const lessonA = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId,
  moduleId: modA.id,
  sequence: 1,
  title: "Lesson A",
  body: "body",
});

describe("ModuleList", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered with one module THEN it shows the module heading and its lesson", () => {
    // Arrange
    const map = new Map<string, Lesson[]>([[modA.id, [lessonA]]]);

    // Act
    render(
      <ModuleList
        course={course}
        modules={[modA]}
        lessonsByModuleId={map}
        currentLessonId={lessonA.id}
      />,
    );

    // Assert
    expect(screen.getByRole("heading", { name: "Module A" })).toBeInTheDocument();
    expect(screen.getByText("Lesson A")).toBeInTheDocument();
  });
});
