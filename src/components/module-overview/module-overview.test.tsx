import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ModuleOverview } from "./module-overview";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const course = Course.parse({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "course-1",
  title: "Course 1",
  description: "Desc",
  language: "en",
  lessonCount: 3,
  moduleCount: 1,
});
const mod1 = Module.parse({
  id: "22222222-2222-4222-8222-222222222222",
  courseId: course.id,
  slug: "mod-1",
  title: "Contractions Reductions",
  sequence: 3,
});

const lessonA = Lesson.parse({
  kind: "video",
  id: "33333333-3333-4333-8333-333333333333",
  courseId: course.id,
  moduleId: mod1.id,
  sequence: 1,
  title: "Lesson A",
  description: "A",
  source: "/local-filesystem-lesson/a.mp4",
  durationSeconds: 240,
});
const lessonB = Lesson.parse({
  ...lessonA,
  id: "44444444-4444-4444-8444-444444444444",
  sequence: 2,
  title: "Lesson B",
});
const readingLesson = Lesson.parse({
  kind: "reading",
  id: "55555555-5555-4555-8555-555555555555",
  courseId: course.id,
  moduleId: mod1.id,
  sequence: 3,
  title: "Reading Lesson",
  body: "Some body text.",
});

describe("ModuleOverview", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      () =>
        ((key: string, values?: Record<string, unknown>) =>
          values
            ? `CourseCatalog.moduleOverview.${key}:${JSON.stringify(values)}`
            : `CourseCatalog.moduleOverview.${key}`) as never,
    );
  });

  test("renders one Open link per lesson, in sequence order, with locale-aware hrefs", () => {
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );
    const links = screen.getAllByRole("link", { name: /CourseCatalog\.moduleOverview\.open/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/33333333-3333-4333-8333-333333333333",
    );
    expect(links[1]).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/44444444-4444-4444-8444-444444444444",
    );
  });

  test("shows a duration for video lessons and omits it for reading lessons", () => {
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, readingLesson]}
      />,
    );
    // Only the video lesson has a duration label.
    expect(screen.getAllByText('CourseCatalog.moduleOverview.duration:{"minutes":4}')).toHaveLength(
      1,
    );
  });

  test("back link returns to the course overview", () => {
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA]}
      />,
    );
    expect(screen.getByRole("link", { name: "← Course 1" })).toHaveAttribute(
      "href",
      "/courses/course-1",
    );
  });
});
