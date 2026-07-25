import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";

import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseCard } from "./course-card";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const course = Course.parse({
  id: CourseId.parse("11111111-1111-4111-8111-111111111111"),
  slug: "course-1",
  title: "Course One",
  description: "Course description",
  language: "en",
  lessonCount: 12,
  moduleCount: 3,
});

const courseWithPoster = Course.parse({
  id: CourseId.parse("22222222-2222-4222-8222-222222222222"),
  slug: "course-2",
  title: "Course Two",
  description: "Course description",
  language: "en",
  lessonCount: 12,
  moduleCount: 3,
});

const firstLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse("33333333-3333-4333-8333-333333333333"),
  courseId: courseWithPoster.id,
  moduleId: ModuleId.parse("44444444-4444-4444-8444-444444444444"),
  sequence: 1,
  title: "First Lesson",
  description: "Lesson description",
  source: "/local-filesystem-lesson/lesson.mp4",
  durationSeconds: 120,
  poster: "/local-filesystem-lesson/poster.jpeg",
});

describe("CourseCard", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      () =>
        ((key: string, values?: Record<string, unknown>) =>
          values ? `${key}:${JSON.stringify(values)}` : `CourseCatalog.card.${key}`) as never,
    );
  });

  test("renders the course title, module/lesson counts and locale-aware link", () => {
    render(
      <CourseCard
        course={course}
        firstLesson={null}
        trackLabel="Course modules in order"
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Course One" })).toBeInTheDocument();
    expect(screen.getByTestId("course-card-link")).toHaveAttribute("href", "/courses/course-1");
    expect(screen.getByLabelText("Course modules in order")).toBeInTheDocument();
  });

  test("renders the lesson poster when the first lesson provides one", () => {
    render(
      <CourseCard
        course={courseWithPoster}
        firstLesson={firstLesson}
        trackLabel="Course modules in order"
      />,
    );
    const img = screen.getByRole("img", { name: /Course Two/ });
    expect(img).toHaveAttribute("src", "/local-filesystem-lesson/poster.jpeg");
  });
});
