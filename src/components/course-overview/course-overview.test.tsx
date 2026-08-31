import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { render, screen } from "@testing-library/react";
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
  sequence: 1,
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
  title: "Module 2",
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

const summaryFor = (module: Module): ModuleSummary => ({
  moduleId: module.id,
  lessonCount: 2,
  totalDurationSeconds: 600,
  leadingLessons: [
    {
      id: LessonId.parse("55555555-5555-4555-8555-555555555555"),
      sequence: 1,
      title: `${module.title} lesson one`,
      poster: "/local-filesystem-lesson/poster.jpeg",
    },
  ],
});

const renderOverview = (overrides?: {
  modules?: Module[];
  moduleSummaries?: ModuleSummary[];
  firstLesson?: Lesson | null;
}) => {
  const modules = overrides?.modules ?? [mod1, mod2];
  return render(
    <CourseOverview
      course={course}
      modules={modules}
      moduleSummaries={overrides?.moduleSummaries ?? modules.map(summaryFor)}
      firstLesson={overrides?.firstLesson === undefined ? firstLesson : overrides.firstLesson}
    />,
  );
};

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

  test("renders the course title and a Start course CTA when a first lesson exists", () => {
    renderOverview();
    expect(screen.getByRole("heading", { level: 1, name: "Course 1" })).toBeInTheDocument();
    expect(screen.getByTestId("start-course")).toHaveAttribute(
      "href",
      "/courses/course-1/modules/mod-1/lessons/44444444-4444-4444-8444-444444444444",
    );
  });

  test("renders one showcase card per module, numbered in sequence", () => {
    renderOverview();
    const ordinals = screen.getAllByTestId("module-showcase-ordinal");
    expect(ordinals).toHaveLength(2);
    expect(ordinals[0]).toHaveTextContent('moduleOrdinal:{"number":1}');
    expect(ordinals[1]).toHaveTextContent('moduleOrdinal:{"number":2}');
    const cards = [...screen.getByTestId("course-module-list").children];
    expect(cards).toHaveLength(2);
    for (const card of cards) expect(card.tagName).toBe("LI");
  });

  test("each card links to its module overview", () => {
    renderOverview();
    const ctas = screen.getAllByTestId("module-showcase-cta");
    expect(ctas).toHaveLength(2);
    expect(ctas[0]).toHaveAttribute("href", "/courses/course-1/modules/mod-1");
    expect(ctas[1]).toHaveAttribute("href", "/courses/course-1/modules/mod-2");
  });

  test("drops the retired season heading, poster grid and Module badge", () => {
    renderOverview();
    // The grid and the practice track that preceded it are both gone.
    expect(screen.queryByTestId("course-episode-grid")).toBeNull();
    expect(screen.queryByTestId("course-track")).toBeNull();
    expect(screen.queryByTestId("poster-card")).toBeNull();
    const overview = screen.getByTestId("course-overview");
    expect(overview.textContent).not.toContain("season");
    expect(overview.textContent).not.toContain("limitedSeries");
    expect(overview.textContent).not.toContain("moduleLabel");
  });

  test("skips a module that has no summary rather than crashing", () => {
    renderOverview({ moduleSummaries: [summaryFor(mod1)] });
    expect(screen.getAllByTestId("module-showcase-ordinal")).toHaveLength(1);
  });

  test("omits the Start course CTA when the course has no first lesson", () => {
    renderOverview({ firstLesson: null });
    expect(screen.queryByTestId("start-course")).toBeNull();
  });
});
