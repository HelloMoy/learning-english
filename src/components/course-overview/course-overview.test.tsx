import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseOverview } from "./course-overview";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const course = Course.parse({
  id: CourseId.parse("11111111-1111-4111-8111-111111111111"),
  slug: "course-1",
  title: "Course 1",
  description: "Course description",
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
});

const mod1 = Module.parse({
  id: ModuleId.parse("22222222-2222-4222-8222-222222222222"),
  courseId: course.id,
  slug: "mod-1",
  title: "Module 1",
  sequence: 1,
});
const mod2 = Module.parse({
  ...mod1,
  id: ModuleId.parse("33333333-3333-4333-8333-333333333333"),
  slug: "mod-2",
  sequence: 2,
});

const firstLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse("44444444-4444-4444-8444-444444444444"),
  courseId: course.id,
  moduleId: mod1.id,
  sequence: 1,
  title: "First lesson",
  description: "First lesson",
  source: "/local-filesystem-lesson/lesson.mp4",
  durationSeconds: 240,
});

describe("CourseOverview", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      () =>
        ((key: string, values?: Record<string, unknown>) =>
          values
            ? `CourseCatalog.courseOverview.${key}:${JSON.stringify(values)}`
            : `CourseCatalog.courseOverview.${key}`) as never,
    );
  });

  test("renders the course title, module list and a Start course CTA when a first lesson exists", () => {
    render(
      <CourseOverview
        course={course}
        modules={[mod1, mod2]}
        firstLesson={firstLesson}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Course 1" })).toBeInTheDocument();
    expect(screen.getByTestId("start-course")).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/44444444-4444-4444-8444-444444444444",
    );
  });

  test("renders one poster per module linking to its module overview (no practice track)", () => {
    render(
      <CourseOverview
        course={course}
        modules={[mod1, mod2]}
        firstLesson={firstLesson}
      />,
    );
    const grid = screen.getByTestId("course-episode-grid");
    const links = within(grid).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/courses/course-1/modules/mod-1");
    expect(links[1]).toHaveAttribute("href", "/courses/course-1/modules/mod-2");
    // The old practice track is gone.
    expect(screen.queryByTestId("course-track")).toBeNull();
  });

  test("omits the Start course CTA when the course has no first lesson", () => {
    render(
      <CourseOverview
        course={course}
        modules={[mod1, mod2]}
        firstLesson={null}
      />,
    );
    expect(screen.queryByTestId("start-course")).toBeNull();
  });
});
