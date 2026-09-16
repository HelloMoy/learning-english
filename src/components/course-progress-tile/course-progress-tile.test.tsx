import { Course } from "@/domain/entities/course/course";
import type { ProgressTally } from "@/lib/course-overview-progress/course-overview-progress";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseProgressTile } from "./course-progress-tile";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

/** The string the key-echoing `useTranslations` mock produces for a message. */
const msg = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

const course = Course.parse({
  id: faker.string.uuid(),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 48,
  moduleCount: 5,
  sequence: 1,
});

const tally = (overrides: Partial<ProgressTally>): ProgressTally => ({
  completedCount: 0,
  lessonCount: 48,
  completedFraction: 0,
  secondsLeft: 629 * 60,
  ...overrides,
});

describe("CourseProgressTile", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
  });

  describe("GIVEN the course is part-way watched", () => {
    test("WHEN the tile renders THEN the course title is the page heading AND progress reads in videos and time", () => {
      // Act
      render(
        <CourseProgressTile
          course={course}
          reading={{
            status: "read",
            tally: tally({ completedCount: 2, completedFraction: 2 / 48, secondsLeft: 607 * 60 }),
          }}
        />,
      );

      // Assert
      expect(screen.getByRole("heading", { level: 1, name: "Basic Course" })).toBeInTheDocument();
      const tile = screen.getByTestId("course-progress-tile");
      expect(tile).toHaveAttribute("data-status", "read");
      expect(tile).toHaveTextContent(msg("percentComplete", { percent: 2 / 48 }));
      expect(tile).toHaveTextContent(msg("completedOfTotal", { completed: 2, total: 48 }));
      expect(tile).toHaveTextContent(
        msg("timeLeft", { duration: msg("durationHoursMinutes", { hours: 10, minutes: 7 }) }),
      );
    });
  });

  describe("GIVEN every video is watched", () => {
    test("WHEN the tile renders THEN it states all watched instead of time left", () => {
      // Act
      render(
        <CourseProgressTile
          course={course}
          reading={{
            status: "read",
            tally: tally({ completedCount: 48, completedFraction: 1, secondsLeft: 0 }),
          }}
        />,
      );

      // Assert
      const tile = screen.getByTestId("course-progress-tile");
      expect(tile).toHaveTextContent(msg("percentComplete", { percent: 1 }));
      expect(tile).toHaveTextContent("allWatchedShort");
      expect(tile).not.toHaveTextContent("timeLeft");
    });
  });

  describe("GIVEN the course's prizes", () => {
    const prizes = [
      { prize: "whistle", isClaimed: true },
      { prize: "harmonica", isClaimed: false },
      { prize: "megaphone", isClaimed: false },
    ] as const;

    test("WHEN the reading has arrived THEN the tile counts the prizes claimed", () => {
      render(
        <CourseProgressTile
          course={course}
          reading={{ status: "read", tally: tally({ completedCount: 2 }) }}
          prizes={[...prizes]}
        />,
      );

      expect(screen.getByTestId("course-progress-tile")).toHaveTextContent(
        msg("prizesClaimed", { claimed: 1, total: 3 }),
      );
    });

    test("WHEN it renders the prizes THEN each carries its own state AND none is a control", () => {
      render(
        <CourseProgressTile
          course={course}
          reading={{ status: "read", tally: tally({}) }}
          prizes={[...prizes]}
        />,
      );

      const tile = screen.getByTestId("course-progress-tile");
      expect(tile.querySelector('svg[data-prize="whistle"][data-locked="false"]')).not.toBeNull();
      expect(tile.querySelector('svg[data-prize="harmonica"][data-locked="true"]')).not.toBeNull();
      expect(tile.querySelectorAll("button, a")).toHaveLength(0);
    });

    test("WHEN the prizes are drawn THEN each sits on its own scrim AND is big enough to read", () => {
      // The row sits over the card, but the toys are small: without a veil the
      // silhouettes blur into it.
      render(
        <CourseProgressTile
          course={course}
          reading={{ status: "read", tally: tally({}) }}
          prizes={[...prizes]}
        />,
      );

      const tile = screen.getByTestId("course-progress-tile");
      const badge = tile.querySelector('[data-testid="course-progress-tile-prize"]');
      expect(badge?.getAttribute("style") ?? "").toContain("radial-gradient");
      expect(tile.querySelector('svg[data-prize="whistle"]')).toHaveAttribute("width", "30");
    });

    test("WHEN the reading has not arrived THEN it says nothing about prizes", () => {
      // Claims are read on the device too: before they answer, "0 claimed"
      // would be an assertion the page cannot justify.
      render(
        <CourseProgressTile
          course={course}
          reading={{ status: "pending" }}
          prizes={[...prizes]}
        />,
      );

      expect(screen.getByTestId("course-progress-tile")).not.toHaveTextContent("prizesClaimed");
    });
  });

  describe("GIVEN progress is not known yet", () => {
    test("WHEN the tile renders THEN it names the course AND asserts no progress", () => {
      // Act
      render(
        <CourseProgressTile
          course={course}
          reading={{ status: "pending" }}
        />,
      );

      // Assert
      expect(screen.getByRole("heading", { level: 1, name: "Basic Course" })).toBeInTheDocument();
      const tile = screen.getByTestId("course-progress-tile");
      expect(tile).toHaveAttribute("data-status", "pending");
      expect(tile).not.toHaveTextContent("percentComplete");
      expect(tile).not.toHaveTextContent("completedOfTotal");
    });
  });
});
