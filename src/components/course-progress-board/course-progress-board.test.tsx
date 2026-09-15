import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";

import { faker } from "@faker-js/faker";
import { render, screen, waitFor } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseProgressBoard } from "./course-progress-board";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: vi.fn(),
}));

const COMPLETED_KEY_PREFIX = "learning-english:completed:";

const msg = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

const course = Course.parse({
  id: faker.string.uuid(),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 5,
  moduleCount: 2,
  sequence: 1,
});

const aModule = (sequence: number) =>
  Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: `module-${sequence}`,
    title: `Lesson ${sequence}`,
    sequence,
  });

const modules = [aModule(1), aModule(2)];

const moduleSummaries: ModuleSummary[] = modules.map((module, moduleIndex) => {
  const lessonCount = moduleIndex === 0 ? 2 : 3;
  return {
    moduleId: module.id,
    lessonCount,
    totalDurationSeconds: lessonCount * 600,
    lessons: Array.from({ length: lessonCount }, (_, index) => ({
      id: LessonId.parse(faker.string.uuid()),
      sequence: index + 1,
      title: faker.lorem.words(3),
      durationSeconds: 600,
    })),
  };
});

const videoOf = (moduleIndex: number, lessonIndex: number) =>
  moduleSummaries[moduleIndex]!.lessons[lessonIndex]!;

const storedLocation = (
  location: Promise<ContinueWatchingLocation | null>,
): ContinueWatchingRepository => ({
  get: () => location,
  set: vi.fn(),
});

const renderBoard = (continueWatching: ContinueWatchingRepository, summaries = moduleSummaries) =>
  render(
    <CourseProgressBoard
      course={course}
      modules={modules}
      moduleSummaries={summaries}
      continueWatching={continueWatching}
    />,
  );

const tileStatuses = () =>
  screen.getAllByTestId("lesson-ring-tile").map((tile) => tile.getAttribute("data-status"));

describe("CourseProgressBoard", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
    vi.mocked(useIsHydrated).mockReturnValue(true);
    window.localStorage.clear();
  });

  describe("GIVEN progress is not known yet", () => {
    test("WHEN the page has not hydrated THEN every tile is pending", () => {
      // Arrange
      vi.mocked(useIsHydrated).mockReturnValue(false);

      // Act
      renderBoard(storedLocation(Promise.resolve(null)));

      // Assert
      expect(screen.getByTestId("continue-tile")).toHaveAttribute("data-status", "pending");
      expect(screen.getByTestId("course-progress-tile")).toHaveAttribute("data-status", "pending");
      expect(tileStatuses()).toEqual(["pending", "pending"]);
    });

    test("WHEN the continue-watching record has not been read THEN every tile is pending", () => {
      // Act
      renderBoard(storedLocation(new Promise(() => {})));

      // Assert
      expect(screen.getByTestId("continue-tile")).toHaveAttribute("data-status", "pending");
      expect(tileStatuses()).toEqual(["pending", "pending"]);
    });
  });

  describe("GIVEN the first lesson finished AND a record in the second lesson", () => {
    test("WHEN the board settles THEN the tiles read progress AND Continue opens the recorded video", async () => {
      // Arrange
      for (const lesson of moduleSummaries[0]!.lessons) {
        window.localStorage.setItem(`${COMPLETED_KEY_PREFIX}${lesson.id}`, "1");
      }
      const location = ContinueWatchingLocation.parse({
        courseSlug: course.slug,
        moduleSlug: "module-2",
        lessonId: videoOf(1, 1).id,
      });

      // Act
      renderBoard(storedLocation(Promise.resolve(location)));

      // Assert
      await waitFor(() =>
        expect(screen.getByTestId("continue-tile")).toHaveAttribute("data-status", "read"),
      );
      expect(screen.getByRole("link", { name: /continueWhereLeftOff/ })).toHaveAttribute(
        "href",
        `/courses/basic-course/modules/module-2/lessons/${videoOf(1, 1).id}`,
      );
      expect(tileStatuses()).toEqual(["completed", "not-started"]);
      const tiles = screen.getAllByTestId("lesson-ring-tile");
      expect(tiles.map((tile) => tile.getAttribute("data-current"))).toEqual(["false", "true"]);
      expect(screen.getByTestId("course-progress-tile")).toHaveTextContent(
        msg("completedOfTotal", { completed: 2, total: 5 }),
      );
    });
  });

  describe("GIVEN a course with no videos", () => {
    test("WHEN the board settles THEN it renders no continue tile", async () => {
      // Arrange
      const emptySummaries = moduleSummaries.map((summary) => ({
        ...summary,
        lessonCount: 0,
        totalDurationSeconds: 0,
        lessons: [],
      }));

      // Act
      renderBoard(storedLocation(Promise.resolve(null)), emptySummaries);

      // Assert
      await waitFor(() =>
        expect(screen.getByTestId("course-progress-tile")).toHaveAttribute("data-status", "read"),
      );
      expect(screen.queryByTestId("continue-tile")).toBeNull();
    });
  });
});
