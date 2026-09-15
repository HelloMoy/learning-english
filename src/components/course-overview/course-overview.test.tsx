import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
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
  lessonCount: 4,
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

const summaryFor = (module: Module, lessonCount = 2): ModuleSummary => ({
  moduleId: module.id,
  lessonCount,
  totalDurationSeconds: lessonCount * 300,
  lessons: Array.from({ length: lessonCount }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence: index + 1,
    title: faker.lorem.words(3),
    durationSeconds: 300,
  })),
});

const summaries = [summaryFor(mod1), summaryFor(mod2)];

const renderOverview = (moduleSummaries = summaries) =>
  render(
    <CourseOverview
      course={course}
      modules={[mod1, mod2]}
      moduleSummaries={moduleSummaries}
    />,
  );

describe("CourseOverview", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
    vi.mocked(useIsHydrated).mockReturnValue(true);
    window.localStorage.clear();
  });

  describe("GIVEN a course with videos", () => {
    test("WHEN the overview renders THEN the course title is the page heading", () => {
      // Act
      renderOverview();

      // Assert
      expect(screen.getByRole("heading", { level: 1, name: course.title })).toBeInTheDocument();
    });

    test("WHEN the overview renders THEN every lesson is a ring tile in order AND there is no carousel", () => {
      // Act
      renderOverview();

      // Assert
      expect(
        screen.getAllByTestId("lesson-ring-tile").map((tile) => tile.getAttribute("aria-label")),
      ).toEqual([
        msg("openLessonTile", { number: 1, title: mod1.title }),
        msg("openLessonTile", { number: 2, title: mod2.title }),
      ]);
      expect(screen.queryByRole("region", { name: "carouselLabel" })).toBeNull();
      expect(screen.queryByTestId("module-poster")).toBeNull();
      expect(screen.queryByTestId("lesson-progress-panel")).toBeNull();
    });

    test("WHEN a new learner's progress settles THEN a single Start course action opens the first video", async () => {
      // Act
      renderOverview();

      // Assert
      const start = await screen.findByRole("link", { name: /startCourse/ });
      expect(start).toHaveAttribute(
        "href",
        `/courses/course-1/modules/mod-1/lessons/${summaries[0]!.lessons[0]!.id}`,
      );
      expect(screen.getAllByTestId("continue-tile")).toHaveLength(1);
    });
  });

  describe("GIVEN a course with no videos", () => {
    test("WHEN the overview renders THEN no continue tile renders", () => {
      // Act
      renderOverview([summaryFor(mod1, 0), summaryFor(mod2, 0)]);

      // Assert
      expect(screen.queryByTestId("continue-tile")).toBeNull();
    });
  });
});
