import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseOverview } from "./course-overview";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: vi.fn(),
}));

/**
 * The string the key-echoing `useTranslations` mock produces for a message,
 * so expectations for nested messages need no hand-escaped JSON.
 */
const msg = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "course-1",
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
  sequence: 1,
});

const mod1 = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "mod-1",
  title: faker.lorem.words(2),
  sequence: 1,
});
const mod2 = Module.parse({
  ...mod1,
  id: ModuleId.parse(faker.string.uuid()),
  slug: "mod-2",
  title: faker.lorem.words(2),
  sequence: 2,
});

const firstLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId: course.id,
  moduleId: mod1.id,
  sequence: 1,
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  source: "/local-filesystem-lesson/lesson.mp4",
  durationSeconds: 240,
});

const summaryFor = (module: Module): ModuleSummary => ({
  moduleId: module.id,
  lessonCount: 2,
  totalDurationSeconds: 600,
  lessons: [1, 2].map((sequence) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence,
    title: faker.lorem.words(3),
    durationSeconds: 300,
  })),
});

const renderOverview = (overrides?: { firstLesson?: Lesson | null }) =>
  render(
    <CourseOverview
      course={course}
      modules={[mod1, mod2]}
      moduleSummaries={[mod1, mod2].map(summaryFor)}
      firstLesson={overrides?.firstLesson === undefined ? firstLesson : overrides.firstLesson}
    />,
  );

describe("CourseOverview", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
    vi.mocked(useIsHydrated).mockReturnValue(true);
  });

  describe("GIVEN a course with a first lesson", () => {
    test("WHEN the overview renders THEN the hero shows the now-showing eyebrow AND the course title", () => {
      // Act
      renderOverview();

      // Assert
      expect(screen.getByText(msg("nowShowing", { count: 2 }))).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: course.title })).toBeInTheDocument();
    });

    test("WHEN the overview renders THEN the meta line states the videos AND runtime below the title", () => {
      // Act
      renderOverview();

      // Assert
      const meta = screen.getByTestId("course-hero-meta");
      expect(meta).toHaveTextContent(
        msg("courseMetaShort", {
          videos: msg("lessonCount", { count: 3 }),
          duration: msg("durationMinutes", { minutes: 20 }),
        }),
      );
      const title = screen.getByRole("heading", { level: 1 });
      expect(title.contains(meta)).toBe(false);
      expect(title.compareDocumentPosition(meta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test("WHEN the overview renders THEN a single Start course action opens the first lesson", () => {
      // Act
      renderOverview();

      // Assert
      const startCourse = screen.getAllByTestId("start-course");
      expect(startCourse).toHaveLength(1);
      expect(startCourse[0]).toHaveAttribute(
        "href",
        `/courses/course-1/modules/mod-1/lessons/${firstLesson.id}`,
      );
    });

    test("WHEN the overview renders THEN it presents the modules as a carousel AND no shelves", () => {
      // Act
      renderOverview();

      // Assert
      expect(screen.getByRole("region", { name: "carouselLabel" })).toBeInTheDocument();
      expect(screen.getAllByTestId("module-poster")).toHaveLength(2);
      expect(screen.queryByTestId("module-shelf")).toBeNull();
    });
  });

  describe("GIVEN a course with no first lesson", () => {
    test("WHEN the overview renders THEN no Start course action renders", () => {
      // Act
      renderOverview({ firstLesson: null });

      // Assert
      expect(screen.queryByTestId("start-course")).toBeNull();
    });
  });
});
