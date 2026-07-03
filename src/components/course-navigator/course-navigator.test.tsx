import type { CourseId, LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import { err, ok } from "@/domain/result/result";
import type { FindNextLesson } from "@/domain/use-cases/find-next-lesson/find-next-lesson";

import { render, screen, waitFor } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseNavigator } from "./course-navigator";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const courseId = "11111111-1111-4111-8111-111111111111" as CourseId;
const currentLessonId = "22222222-2222-4222-8222-222222222221" as LessonId;

const nextLessonStub: Lesson = {
  kind: "reading",
  id: "22222222-2222-4222-8222-222222222222" as LessonId,
  courseId,
  sequence: 2,
  title: "Consonant clusters in English",
  body: "Body",
};

describe("CourseNavigator", () => {
  beforeEach(() => {
    // Identity translation: key in → key out. Keeps assertions readable.
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  describe("GIVEN the use case resolves with a next lesson", () => {
    test("WHEN the component renders THEN it shows the next-lesson link", async () => {
      // Arrange
      const findNextLesson = vi.fn<FindNextLesson>();
      findNextLesson.mockResolvedValue(ok(nextLessonStub));

      // Act
      render(
        <CourseNavigator
          courseId={courseId}
          currentLessonId={currentLessonId}
          findNextLesson={findNextLesson}
        />,
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument();
      });
      expect(findNextLesson).toHaveBeenCalledWith({ courseId, currentLessonId });
    });
  });

  describe("GIVEN the use case resolves with `null` (course completed)", () => {
    test("WHEN the component renders THEN it shows the 'completed' message", async () => {
      // Arrange
      const findNextLesson = vi.fn<FindNextLesson>();
      findNextLesson.mockResolvedValue(ok(null));

      // Act
      render(
        <CourseNavigator
          courseId={courseId}
          currentLessonId={currentLessonId}
          findNextLesson={findNextLesson}
        />,
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("courseCompleted")).toBeInTheDocument();
      });
    });
  });

  describe("GIVEN the use case rejects with `lesson-not-in-course`", () => {
    test("WHEN the component renders THEN it shows the error message", async () => {
      // Arrange
      const findNextLesson = vi.fn<FindNextLesson>();
      findNextLesson.mockResolvedValue(err({ kind: "lesson-not-in-course" }));

      // Act
      render(
        <CourseNavigator
          courseId={courseId}
          currentLessonId={currentLessonId}
          findNextLesson={findNextLesson}
        />,
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
      expect(screen.getByText("error")).toBeInTheDocument();
    });
  });

  describe("GIVEN the user clicks the next-lesson link", () => {
    test("WHEN the user clicks THEN nothing throws (button is interactive)", async () => {
      // Arrange
      const findNextLesson = vi.fn<FindNextLesson>();
      findNextLesson.mockResolvedValue(ok(nextLessonStub));

      // Act + Assert — focuses on behaviour (does not throw), not navigation.
      render(
        <CourseNavigator
          courseId={courseId}
          currentLessonId={currentLessonId}
          findNextLesson={findNextLesson}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument();
      });
      // The link is keyboard-focusable and clickable.
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();

      // No assertion on navigation logic in v0 — the test asserts the
      // component does not throw on interaction.
      link.click();
    });
  });
});
