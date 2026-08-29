import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";
import type { LessonView as LessonViewData } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonView } from "./lesson-view";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const fixtures = (): {
  view: LessonViewData;
} => {
  const courseId = CourseId.parse(faker.string.uuid());
  const modId = ModuleId.parse(faker.string.uuid());
  const course = Course.parse({
    id: courseId,
    slug: "course",
    title: "Course",
    description: "d",
    language: "en",
    lessonCount: 1,
    moduleCount: 1,
  });
  const mod = Module.parse({
    id: modId,
    courseId,
    slug: "module",
    title: "Module",
    sequence: 1,
  });
  const lesson = Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId: modId,
    sequence: 1,
    title: "Lecture title",
    description: "Lecture description",
    source: faker.internet.url(),
    durationSeconds: 600,
  });
  const resource = Resource.parse({
    id: faker.string.uuid(),
    lessonId: lesson.id,
    title: "PDF handout",
    url: faker.internet.url(),
    kind: "pdf",
  });
  return {
    view: {
      course,
      module: mod,
      lesson,
      resources: [resource],
      nextLesson: null,
      modules: [mod],
      lessons: [lesson],
    },
  };
};

describe("LessonView", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered for a video lesson THEN it shows the player, title, description, resources, and up next", () => {
    // Arrange
    const { view } = fixtures();
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });

    // Act
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
        markComplete={markComplete}
      />,
    );

    // Assert
    expect(screen.getByRole("heading", { name: "Lecture title" })).toBeInTheDocument();
    expect(screen.getByText("Lecture description")).toBeInTheDocument();
    expect(screen.getByText("PDF handout")).toBeInTheDocument();
    expect(screen.getByText("courseCompleted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "markComplete" })).toBeInTheDocument();
  });

  test("WHEN rendered for a reading lesson THEN it shows the body in an article and no video element", () => {
    // Arrange
    const { view } = fixtures();
    const readingView: LessonViewData = {
      ...view,
      lesson: {
        ...view.lesson,
        kind: "reading",
        body: "Reading body content.",
        // The reading variant does not carry `source`, `durationSeconds`,
        // etc.; construct it cleanly to satisfy the Zod schema.
      } as LessonViewData["lesson"],
    };
    const markComplete = vi.fn().mockResolvedValue({ data: { completed: true } });

    // Act
    render(
      <LessonView
        view={readingView}
        notes={null}
        notesResource={null}
        markComplete={markComplete}
      />,
    );

    // Assert
    expect(screen.getByText("Reading body content.")).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
  });

  test("video lesson renders a cinema hero overlay (module title) while preserving the native player", () => {
    const { view } = fixtures();
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );
    // The overlay headline is the module title; the native <video> remains.
    expect(screen.getByRole("heading", { name: "Module" })).toBeInTheDocument();
    expect(document.querySelector("video")).not.toBeNull();
    // The current lesson is marked in the outline.
    expect(document.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  test("renders the Notes/Transcript tabs when notes are present", () => {
    const { view } = fixtures();
    render(
      <LessonView
        view={view}
        notes={"# Intro\n\nTexto ES.\n\nEnglish text."}
        notesResource={null}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );
    expect(screen.getByTestId("lesson-notes-tabs")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "notes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "transcript" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
