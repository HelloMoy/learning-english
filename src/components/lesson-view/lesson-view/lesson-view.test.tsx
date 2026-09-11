import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";
import type { LessonView as LessonViewData } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";
import { emitPlayerEvent, findPlayerIn } from "@/test-setup/stubs/vidstack-player";

import { faker } from "@faker-js/faker";
import { act, render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonView } from "./lesson-view";

vi.mock("next-intl", () => ({
  // The outline's watch-progress bar formats its percentage through next-intl
  // rather than concatenating a string, so the mock has to answer for the
  // formatter too.
  useFormatter: () => ({ number: (value: number) => `${Math.round(value * 100)}%` }),
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const fixtures = (
  options: { poster?: string; source?: string } = {},
): {
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
    sequence: 1,
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
    source: options.source ?? faker.internet.url(),
    durationSeconds: 600,
    ...(options.poster === undefined ? {} : { poster: options.poster }),
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

/**
 * The `readme.md` the Notes tab renders inline. It arrives in `view.resources`
 * like any other resource, which is exactly why the rail has to filter it out.
 */
const notesResourceFor = (lessonId: LessonId): Resource =>
  Resource.parse({
    id: faker.string.uuid(),
    lessonId,
    title: "Vowel Sound Notes",
    url: faker.internet.url(),
    kind: "other",
  });

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
    expect(screen.queryByRole("region", { name: "videoPlayerLabel" })).toBeNull();
  });

  test("a poster-less video lesson shows the title cover over the idle player", () => {
    const { view } = fixtures();
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );
    // Without a poster the frame is black, so the cover is the only cover
    // art the page has. Its headline is the module title.
    expect(screen.getByRole("heading", { name: "Module" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "videoPlayerLabel" })).toBeInTheDocument();
    // The current lesson is marked in the outline.
    expect(document.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  test("a video lesson WITH a poster never shows the title cover", () => {
    const { view } = fixtures({ poster: "/thumbnails/lecture.jpg" });
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );
    // The thumbnail is the cover; painting titles over it would be the
    // watermark this change exists to remove.
    expect(screen.queryByRole("heading", { name: "Module" })).toBeNull();
    expect(screen.getByRole("region", { name: "videoPlayerLabel" })).toBeInTheDocument();
  });

  test("a YouTube video lesson with no poster never shows the title cover", () => {
    // The `poster` field is absent, but the frame is not black: the YouTube
    // provider paints its own thumbnail. Keying the cover on `poster` alone
    // would drop the gold headline on top of it.
    const { view } = fixtures({ source: "https://www.youtube.com/embed/yY7RWGUbqng?si=nB8s" });
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Module" })).toBeNull();
    expect(screen.getByRole("region", { name: "videoPlayerLabel" })).toBeInTheDocument();
  });

  test("starting playback retires the title cover for the rest of the session", () => {
    const { view } = fixtures();
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );
    const player = findPlayerIn(screen.getByRole("region", { name: "videoPlayerLabel" }));
    expect(screen.getByRole("heading", { name: "Module" })).toBeInTheDocument();

    act(() => {
      emitPlayerEvent(player, "play");
    });
    expect(screen.queryByRole("heading", { name: "Module" })).toBeNull();

    // Regression guard for the reported bug: the cover must not flash back
    // when the learner pauses mid-lesson, nor on a seek or on ended.
    act(() => {
      emitPlayerEvent(player, "pause");
      emitPlayerEvent(player, "seeking");
      emitPlayerEvent(player, "ended");
    });
    expect(screen.queryByRole("heading", { name: "Module" })).toBeNull();
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

  test("WHEN a lesson carries a notes resource THEN the rail offers no link to the raw file", () => {
    // Arrange
    const { view } = fixtures();
    const notesResource = notesResourceFor(view.lesson.id);

    // Act
    render(
      <LessonView
        view={{ ...view, resources: [...view.resources, notesResource] }}
        notes={"# Intro\n\nTexto ES."}
        notesResource={notesResource}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );

    // Assert: no dedicated notes card, and the file is not folded into
    // Resources under the default heading either.
    expect(screen.queryByRole("region", { name: "resourceTitle" })).toBeNull();
    expect(screen.queryByText(notesResource.title)).toBeNull();
    expect(screen.queryByRole("link", { name: notesResource.title })).toBeNull();
    expect(screen.getByText("PDF handout")).toBeInTheDocument();
  });

  test("WHEN the notes file is a lesson's only resource THEN Resources shows its empty state", () => {
    // Arrange
    const { view } = fixtures();
    const notesResource = notesResourceFor(view.lesson.id);

    // Act
    render(
      <LessonView
        view={{ ...view, resources: [notesResource] }}
        notes={"# Intro\n\nTexto ES."}
        notesResource={notesResource}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );

    // Assert: one card showing "no resources", not a second card beside it.
    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.queryByText(notesResource.title)).toBeNull();
    expect(screen.queryByRole("region", { name: "resourceTitle" })).toBeNull();
  });

  test("WHEN a notes resource is present THEN the Notes tab still renders its body", () => {
    // Arrange: guards against the rail removal reaching into the centre column.
    const { view } = fixtures();
    const notesResource = notesResourceFor(view.lesson.id);

    // Act
    render(
      <LessonView
        view={{ ...view, resources: [notesResource] }}
        notes={"# Intro\n\nTexto ES."}
        notesResource={notesResource}
        markComplete={vi.fn().mockResolvedValue({ data: { completed: true } })}
      />,
    );

    // Assert
    expect(screen.getByTestId("lesson-notes-tabs")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "notes" })).toBeInTheDocument();
  });
});
