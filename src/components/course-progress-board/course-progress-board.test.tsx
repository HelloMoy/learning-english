import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { refreshPrizeClaims } from "@/hooks/use-prize-claims/use-prize-claims";

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
    // The claims store caches its snapshot, so clearing storage is not enough:
    // without this, one test's claim is still claimed in the next.
    refreshPrizeClaims();
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

  describe("GIVEN the prizes these lessons redeem", () => {
    const claimPrizeOf = (moduleSlug: string) => {
      window.localStorage.setItem(`learning-english:prize-claimed:${moduleSlug}`, "1");
      refreshPrizeClaims();
    };

    test("WHEN a prize has been claimed THEN its tile says so AND the others do not", async () => {
      claimPrizeOf("module-1");

      renderBoard(storedLocation(Promise.resolve(null)));

      await waitFor(() =>
        expect(screen.getByTestId("course-progress-tile")).toHaveAttribute("data-status", "read"),
      );
      const claimed = screen
        .getAllByTestId("lesson-ring-tile")
        .map((tile) => tile.getAttribute("data-prize-claimed"));
      expect(claimed).toEqual(["true", "false"]);
    });

    test("WHEN no prize has been claimed THEN every tile carries its prize unclaimed", async () => {
      renderBoard(storedLocation(Promise.resolve(null)));

      await waitFor(() =>
        expect(screen.getByTestId("course-progress-tile")).toHaveAttribute("data-status", "read"),
      );
      const tiles = screen.getAllByTestId("lesson-ring-tile");
      expect(tiles.map((tile) => tile.getAttribute("data-prize-claimed"))).toEqual([
        "false",
        "false",
      ]);
      // Every module carries a prize: a slug the catalogue does not know still
      // redeems the gift box.
      expect(tiles.every((tile) => (tile.getAttribute("data-prize") ?? "").length > 0)).toBe(true);
    });

    test("WHEN the board settles THEN the course tile counts the prizes claimed", async () => {
      claimPrizeOf("module-1");

      renderBoard(storedLocation(Promise.resolve(null)));

      await waitFor(() =>
        expect(screen.getByTestId("course-progress-tile")).toHaveTextContent(
          msg("prizesClaimed", { claimed: 1, total: 2 }),
        ),
      );
    });

    test("WHEN a lesson holds no videos THEN it is counted in neither prize figure", async () => {
      // Nothing to redeem, so it is no prize — the counter counts it the same way.
      const summaries = moduleSummaries.map((summary, index) =>
        index === 1
          ? { ...summary, lessonCount: 0, totalDurationSeconds: 0, lessons: [] }
          : summary,
      );

      renderBoard(storedLocation(Promise.resolve(null)), summaries);

      await waitFor(() =>
        expect(screen.getByTestId("course-progress-tile")).toHaveTextContent(
          msg("prizesClaimed", { claimed: 0, total: 1 }),
        ),
      );
    });
  });
});
