import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ModuleLesson } from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ContinueTile } from "./continue-tile";

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

const vowels = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 2,
});

const lesson: ModuleLesson = {
  id: LessonId.parse(faker.string.uuid()),
  sequence: 2,
  title: "The Vowel Sound /ɪ/ (e corta)",
  durationSeconds: 535,
  poster: "/local-filesystem-lesson/basic-course/2-vowels/2-the-vowel-sound-ih/thumbnail.jpeg",
};

const LESSON_HREF = `/courses/basic-course/modules/2-vowels/lessons/${lesson.id}`;

const renderTile = (kind: "start" | "continue" | "rewatch") =>
  render(
    <ContinueTile
      course={course}
      reading={{
        status: "read",
        target: { kind, module: vowels, lesson, lessonNumber: 2 },
        videoCount: 17,
      }}
    />,
  );

describe("ContinueTile", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
  });

  describe("GIVEN a video to continue", () => {
    test("WHEN the tile renders THEN it shows the video's position, title AND artwork", () => {
      // Act
      renderTile("continue");

      // Assert
      const tile = screen.getByTestId("continue-tile");
      expect(tile).toHaveTextContent(msg("videoPosition", { module: "02", number: 2, total: 17 }));
      expect(tile).toHaveTextContent(lesson.title);
      expect(tile.querySelector("img")).toHaveAttribute("src", lesson.poster);
    });

    test("WHEN the tile renders THEN a single Continue where you left off action opens that video", () => {
      // Act
      renderTile("continue");

      // Assert
      const actions = screen.getAllByRole("link");
      expect(actions).toHaveLength(1);
      expect(actions[0]).toHaveTextContent("continueWhereLeftOff");
      expect(actions[0]).toHaveAttribute("href", LESSON_HREF);
    });
  });

  describe.each([
    ["start", "startCourse"],
    ["rewatch", "watchAgain"],
  ] as const)("GIVEN a %s target", (kind, label) => {
    test(`WHEN the tile renders THEN the action reads ${label}`, () => {
      // Act
      renderTile(kind);

      // Assert
      expect(screen.getByRole("link")).toHaveTextContent(label);
      expect(screen.getByRole("link")).toHaveAttribute("href", LESSON_HREF);
    });
  });

  describe("GIVEN progress is not known yet", () => {
    test("WHEN the tile renders THEN it shows placeholders AND no action", () => {
      // Act
      render(
        <ContinueTile
          course={course}
          reading={{ status: "pending" }}
        />,
      );

      // Assert
      const tile = screen.getByTestId("continue-tile");
      expect(tile).toHaveAttribute("data-status", "pending");
      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getAllByTestId("continue-tile-placeholder").length).toBeGreaterThan(0);
    });
  });
});
