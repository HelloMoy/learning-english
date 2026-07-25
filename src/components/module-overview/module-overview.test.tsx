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
  lessonCount: 2,
  moduleCount: 1,
});
const mod1 = Module.parse({
  id: "22222222-2222-4222-8222-222222222222",
  courseId: course.id,
  slug: "mod-1",
  title: "Module 1",
  sequence: 1,
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

  test("renders one link per lesson with locale-aware href and a duration label", () => {
    render(
      <ModuleOverview
        course={course}
        module={mod1}
        lessons={[lessonA, lessonB]}
      />,
    );
    const links = screen.getAllByRole("link", { name: "CourseCatalog.moduleOverview.openLesson" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/33333333-3333-4333-8333-333333333333",
    );
    expect(links[1]).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/44444444-4444-4444-8444-444444444444",
    );
    expect(screen.getAllByText('CourseCatalog.moduleOverview.duration:{"minutes":4}')).toHaveLength(
      2,
    );
  });
});
