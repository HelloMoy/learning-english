import { Course } from "@/domain/entities/course/course";
import { LessonId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import { faker } from "@faker-js/faker";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseCarousel } from "./course-carousel";

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
  slug: "course-1",
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 12,
  moduleCount: 4,
  sequence: 1,
});

/** Lesson counts per module; the last module holds a single lesson. */
const LESSON_COUNTS = [3, 4, 4, 1];

const modules = LESSON_COUNTS.map((_, index) =>
  Module.parse({
    id: faker.string.uuid(),
    courseId: course.id,
    slug: `${index + 1}-module`,
    title: `${faker.lorem.words(2)} ${index + 1}`,
    sequence: index + 1,
  }),
);

const summaries: ModuleSummary[] = modules.map((module, index) => {
  const count = LESSON_COUNTS[index]!;
  return {
    moduleId: module.id,
    lessonCount: count,
    totalDurationSeconds: count * 600,
    lessons: Array.from({ length: count }, (_, lessonIndex) => ({
      id: LessonId.parse(faker.string.uuid()),
      sequence: lessonIndex + 1,
      title: faker.lorem.words(3),
      durationSeconds: 600,
    })),
  };
});

const renderCarousel = () =>
  render(
    <CourseCarousel
      course={course}
      modules={modules}
      moduleSummaries={summaries}
    />,
  );

const dots = () => screen.getAllByTestId("carousel-dot");
const selectedDotIndex = () =>
  dots().findIndex((dot) => dot.getAttribute("aria-current") === "true");
const panel = () => screen.getByTestId("lesson-progress-panel");

describe("CourseCarousel", () => {
  beforeEach(() => {
    vi.mocked(useTranslations).mockImplementation(() => msg as never);
    vi.mocked(useIsHydrated).mockReturnValue(true);
    window.localStorage.clear();
    act(() => {
      refreshSavedPlaybackPositions();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
  });

  describe("GIVEN a course of four modules the learner has not started", () => {
    test("WHEN the carousel renders THEN it shows one poster AND one dot per module", () => {
      // Act
      renderCarousel();

      // Assert
      expect(screen.getAllByTestId("module-poster")).toHaveLength(4);
      expect(dots()).toHaveLength(4);
      expect(selectedDotIndex()).toBe(0);
    });

    test("WHEN the carousel renders THEN it is a labelled carousel region", () => {
      // Act
      renderCarousel();

      // Assert
      expect(screen.getByRole("region", { name: "carouselLabel" })).toHaveAttribute(
        "aria-roledescription",
        "carousel",
      );
    });

    test("WHEN the first module is selected THEN previous is disabled AND next selects the second module", async () => {
      // Arrange
      const user = userEvent.setup();
      renderCarousel();

      // Act
      expect(screen.getByRole("button", { name: "previousLesson" })).toBeDisabled();
      await user.click(screen.getByRole("button", { name: "nextLesson" }));

      // Assert
      expect(selectedDotIndex()).toBe(1);
      expect(panel()).toHaveTextContent(modules[1]!.title);
    });

    test("WHEN a dot is activated THEN its module is selected AND announced", async () => {
      // Arrange
      const user = userEvent.setup();
      renderCarousel();

      // Act
      await user.click(dots()[2]!);

      // Assert
      expect(selectedDotIndex()).toBe(2);
      expect(screen.getByTestId("carousel-announcement")).toHaveTextContent(
        msg("selectionAnnouncement", { number: 3, total: 4, title: modules[2]!.title }),
      );
    });

    test("WHEN the Right arrow key is pressed inside the carousel THEN the next module is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      renderCarousel();
      dots()[0]!.focus();

      // Act
      await user.keyboard("{ArrowRight}");

      // Assert
      expect(selectedDotIndex()).toBe(1);
    });

    test("WHEN the last module is selected THEN next is disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      renderCarousel();

      // Act
      await user.click(dots()[3]!);

      // Assert
      expect(screen.getByRole("button", { name: "nextLesson" })).toBeDisabled();
    });

    test("WHEN the learner swipes left across the stage THEN the next module is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      renderCarousel();
      const stage = screen.getByTestId("carousel-stage");

      // Act
      await user.pointer([
        { keys: "[TouchA>]", target: stage, coords: { clientX: 320, clientY: 200 } },
        { pointerName: "TouchA", target: stage, coords: { clientX: 120, clientY: 204 } },
        { keys: "[/TouchA]", target: stage, coords: { clientX: 120, clientY: 204 } },
      ]);

      // Assert
      expect(selectedDotIndex()).toBe(1);
    });

    test("WHEN a poster that is not selected is clicked THEN it becomes selected without being a link", async () => {
      // Arrange
      const user = userEvent.setup();
      renderCarousel();
      const neighbour = screen.getAllByTestId("carousel-poster")[1]!;

      // Act
      expect(neighbour.tagName).toBe("BUTTON");
      await user.click(neighbour);

      // Assert
      expect(selectedDotIndex()).toBe(1);
    });

    test("WHEN a module holding several lessons is selected THEN its poster links to the module overview", () => {
      // Act
      renderCarousel();

      // Assert
      const selected = screen.getAllByTestId("carousel-poster")[0]!;
      expect(selected).toHaveAttribute("href", "/courses/course-1/modules/1-module");
      expect(selected).toHaveAccessibleName(modules[0]!.title);
    });

    test("WHEN a module holding one lesson is selected THEN its poster links straight to that lesson", async () => {
      // Arrange
      const user = userEvent.setup();
      renderCarousel();

      // Act
      await user.click(dots()[3]!);

      // Assert
      expect(screen.getAllByTestId("carousel-poster")[3]).toHaveAttribute(
        "href",
        `/courses/course-1/modules/4-module/lessons/${summaries[3]!.lessons[0]!.id}`,
      );
    });
  });

  describe("GIVEN the learner is part-way through the third module", () => {
    test("WHEN the carousel hydrates THEN the third module is selected AND the panel offers to continue", () => {
      // Arrange
      window.localStorage.setItem(`${COMPLETED_KEY_PREFIX}${summaries[2]!.lessons[0]!.id}`, "1");

      // Act
      renderCarousel();

      // Assert
      expect(selectedDotIndex()).toBe(2);
      expect(panel()).toHaveAttribute("data-state", "in-progress");
      expect(within(panel()).getByRole("link", { name: "continueWatching" })).toBeInTheDocument();
    });
  });
});
