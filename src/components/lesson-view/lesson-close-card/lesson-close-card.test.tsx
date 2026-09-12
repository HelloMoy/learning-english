import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { render, screen, within } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonCloseCard } from "./lesson-close-card";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "course",
  title: "Course",
  description: "d",
  language: "en",
  lessonCount: 2,
  moduleCount: 2,
  sequence: 1,
});
const currentModule = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "current-module",
  title: "Current Module",
  sequence: 1,
});
const nextModule = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "next-module",
  title: "Next Module",
  sequence: 2,
});
const nextLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId: course.id,
  moduleId: nextModule.id,
  sequence: 1,
  title: "The Vowel Sound: /ə/",
  description: "desc",
  source: faker.internet.url(),
  durationSeconds: 360,
});

describe("LessonCloseCard", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN it wraps the completion control it is given", () => {
    // Act
    render(
      <LessonCloseCard
        course={course}
        nextLesson={nextLesson}
        nextLessonModule={nextModule}
      >
        <button type="button">Mark as complete</button>
      </LessonCloseCard>,
    );

    // Assert — the block is addressable as a whole, so a browser test can
    // tell the closing row apart from the rail card's link.
    const card = screen.getByTestId("lesson-close-card");
    expect(within(card).getByRole("button", { name: "Mark as complete" })).toBeInTheDocument();
  });

  test("WHEN a next lesson exists THEN the row is one link named after that lesson", () => {
    // Act
    render(
      <LessonCloseCard
        course={course}
        nextLesson={nextLesson}
        nextLessonModule={nextModule}
      >
        <button type="button">Mark as complete</button>
      </LessonCloseCard>,
    );

    // Assert — one link, and a screen reader hears where it goes.
    const link = screen.getByRole("link");
    expect(link).toHaveAccessibleName(new RegExp(nextLesson.title));
  });

  test("WHEN the next lesson belongs to another module THEN the link uses that module's slug", () => {
    // Act
    render(
      <LessonCloseCard
        course={course}
        nextLesson={nextLesson}
        nextLessonModule={nextModule}
      >
        <button type="button">Mark as complete</button>
      </LessonCloseCard>,
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain(
      `/courses/${course.slug}/modules/${nextModule.slug}/lessons/${nextLesson.id}`,
    );
    expect(link.getAttribute("href")).not.toContain(`/modules/${currentModule.slug}/`);
  });
});

describe("LessonCloseCard — last lesson of the course", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN there is no next lesson THEN it shows the end-of-course message and no link", () => {
    // Act
    render(
      <LessonCloseCard
        course={course}
        nextLesson={null}
        nextLessonModule={null}
      >
        <button type="button">Mark as complete</button>
      </LessonCloseCard>,
    );

    // Assert
    expect(screen.getByText("courseCompleted")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("LessonCloseCard — the row as a phone target", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN the row renders THEN it is a 44px-tall target and a long title can wrap", () => {
    // Act
    render(
      <LessonCloseCard
        course={course}
        nextLesson={nextLesson}
        nextLessonModule={nextModule}
      >
        <button type="button">Mark as complete</button>
      </LessonCloseCard>,
    );

    // Assert — a thumb-sized target, not a line of text.
    const link = screen.getByRole("link");
    expect(link).toHaveClass("min-h-11");

    // The text column yields so the title wraps instead of widening the row.
    expect(screen.getByText(nextLesson.title).parentElement).toHaveClass("min-w-0");

    // The chevron keeps its width whatever the title does.
    const icons = link.querySelectorAll("svg");
    expect(icons[icons.length - 1]).toHaveClass("shrink-0");
  });
});
