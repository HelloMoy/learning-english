import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import type { ModuleOverviewProgress } from "@/lib/course-overview-progress/course-overview-progress";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonRingTile } from "./lesson-ring-tile";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

/** The string the key-echoing `useTranslations` mock produces for a message. */
const msg = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

const course = Course.parse({
  id: faker.string.uuid(),
  slug: "basic-course",
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 17,
  moduleCount: 5,
  sequence: 1,
});

const moduleWith = (lessonCount: number) => {
  const courseModule = Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: "2-vowels",
    title: "Vowels",
    sequence: 2,
  });
  const summary: ModuleSummary = {
    moduleId: courseModule.id,
    lessonCount,
    totalDurationSeconds: lessonCount * 600,
    lessons: Array.from({ length: lessonCount }, (_, index) => ({
      id: LessonId.parse(faker.string.uuid()),
      sequence: index + 1,
      title: `Video title ${index + 1}`,
      durationSeconds: 600,
      poster: "/local-filesystem-lesson/poster.jpg",
    })),
  };
  return { module: courseModule, summary };
};

const readingOf = (
  entry: ReturnType<typeof moduleWith>,
  overrides: Partial<ModuleOverviewProgress>,
): { status: "read"; progress: ModuleOverviewProgress } => ({
  status: "read",
  progress: {
    ...entry,
    completedCount: 0,
    lessonCount: entry.summary.lessons.length,
    completedFraction: 0,
    secondsLeft: entry.summary.totalDurationSeconds,
    status: "not-started",
    isCurrent: false,
    ...overrides,
  },
});

const renderTile = (
  entry: ReturnType<typeof moduleWith>,
  reading: Parameters<typeof LessonRingTile>[0]["reading"],
) =>
  render(
    <LessonRingTile
      course={course}
      module={entry.module}
      summary={entry.summary}
      reading={reading}
    />,
  );

describe("LessonRingTile", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
  });

  describe("GIVEN a lesson part-way watched", () => {
    const entry = moduleWith(17);
    const reading = readingOf(entry, {
      completedCount: 1,
      completedFraction: 1 / 17,
      secondsLeft: 144 * 60,
      status: "in-progress",
      isCurrent: true,
    });

    test("WHEN the tile renders THEN it links to the module overview AND is named by its lesson", () => {
      // Act
      renderTile(entry, reading);

      // Assert
      const link = screen.getByRole("link", {
        name: msg("openLessonTile", { number: 2, title: "Vowels" }),
      });
      expect(link).toHaveAttribute("href", "/courses/basic-course/modules/2-vowels");
    });

    test("WHEN the tile renders THEN it shows the ordinal, title, percentage, status AND tally with time left", () => {
      // Act
      renderTile(entry, reading);

      // Assert
      const tile = screen.getByTestId("lesson-ring-tile");
      expect(tile).toHaveAttribute("data-status", "in-progress");
      expect(tile).toHaveAttribute("data-current", "true");
      expect(tile).toHaveTextContent("02");
      expect(tile).toHaveTextContent("Vowels");
      expect(tile).toHaveTextContent(msg("percentComplete", { percent: 1 / 17 }));
      expect(tile).toHaveTextContent("statusInProgress");
      expect(tile).toHaveTextContent(msg("lessonTally", { completed: 1, total: 17 }));
      expect(tile).toHaveTextContent(
        msg("timeLeft", { duration: msg("durationHoursMinutes", { hours: 2, minutes: 24 }) }),
      );
    });

    test("WHEN the tile renders THEN it lists none of the lesson's videos", () => {
      // Act
      renderTile(entry, reading);

      // Assert
      expect(screen.getByTestId("lesson-ring-tile")).not.toHaveTextContent("Video title");
    });

    test("WHEN the tile renders as a phone row THEN its artwork is not faded a second time AND a scrim keeps the text legible", () => {
      // Act
      renderTile(entry, reading);

      // Assert
      const phoneArtwork = screen.getByTestId("lesson-ring-tile-phone-artwork");
      expect(phoneArtwork.className).not.toMatch(/opacity-/);
      expect(phoneArtwork.querySelector("img")).toHaveAttribute(
        "src",
        entry.summary.lessons[0]!.poster,
      );
      expect(screen.getByTestId("lesson-ring-tile-phone-scrim").className).toMatch(
        /bg-linear-to-r/,
      );
    });
  });

  describe("GIVEN a completed lesson", () => {
    test("WHEN the tile renders THEN it reads as completed AND all watched", () => {
      // Arrange
      const entry = moduleWith(3);
      const reading = readingOf(entry, {
        completedCount: 3,
        completedFraction: 1,
        secondsLeft: 0,
        status: "completed",
      });

      // Act
      renderTile(entry, reading);

      // Assert
      const tile = screen.getByTestId("lesson-ring-tile");
      expect(tile).toHaveAttribute("data-status", "completed");
      expect(tile).toHaveTextContent("statusCompleted");
      expect(tile).toHaveTextContent("allWatchedShort");
      expect(tile).not.toHaveTextContent("timeLeft");
    });
  });

  describe("GIVEN a lesson holding exactly one video", () => {
    test("WHEN the tile renders THEN it links straight to that video", () => {
      // Arrange
      const entry = moduleWith(1);

      // Act
      renderTile(entry, readingOf(entry, {}));

      // Assert
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        `/courses/basic-course/modules/2-vowels/lessons/${entry.summary.lessons[0]!.id}`,
      );
    });
  });

  describe("GIVEN progress is not known yet", () => {
    test("WHEN the tile renders THEN it shows the lesson's size AND asserts no progress", () => {
      // Arrange
      const entry = moduleWith(17);

      // Act
      renderTile(entry, { status: "pending" });

      // Assert
      const tile = screen.getByTestId("lesson-ring-tile");
      expect(tile).toHaveAttribute("data-status", "pending");
      expect(tile).toHaveTextContent(
        msg("courseMetaShort", {
          videos: msg("videoCount", { count: 17 }),
          duration: msg("durationHoursMinutes", { hours: 2, minutes: 50 }),
        }),
      );
      expect(tile).not.toHaveTextContent("percentComplete");
      expect(tile).not.toHaveTextContent("status");
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/courses/basic-course/modules/2-vowels",
      );
    });
  });
});
