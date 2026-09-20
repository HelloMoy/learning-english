import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";
import type { LessonView as LessonViewData } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";
import {
  markLessonComplete,
  unmarkLessonComplete,
} from "@/hooks/use-lesson-completion/use-lesson-completion";
import { emitPlayerEvent, findPlayerIn } from "@/test-setup/stubs/vidstack-player";

import { faker } from "@faker-js/faker";
import { act, render, screen, within } from "@testing-library/react";
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

/** The right rail: the `<aside>` the closing card ends, as opposed to the outline's. */
const rail = (): HTMLElement => {
  const aside = screen.getByTestId("lesson-close-card").closest("aside");
  if (aside === null) throw new Error("the closing card is not inside the rail");
  return aside;
};

describe("LessonView", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered for a video lesson THEN it shows the player, title, description, resources, and up next", () => {
    // Arrange
    const { view } = fixtures();

    // Act
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
      />,
    );

    // Assert
    expect(screen.getByRole("heading", { name: "Lecture title" })).toBeInTheDocument();
    expect(screen.getByText("Lecture description")).toBeInTheDocument();
    expect(within(rail()).getByText("PDF handout")).toBeInTheDocument();
    expect(screen.getAllByText("courseCompleted")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "markComplete" })).toBeInTheDocument();
  });

  test("WHEN there is a next lesson THEN the rail closes with it and nothing else offers it", () => {
    // Arrange — the closing card is the page's only next-lesson affordance
    // at every width, and it lives in the rail, under the lesson's materials.
    const { view } = fixtures();
    const nextLesson = Lesson.parse({
      kind: "reading",
      id: LessonId.parse(faker.string.uuid()),
      courseId: view.course.id,
      moduleId: view.module.id,
      sequence: 2,
      title: "Next lesson title",
      body: "body",
    });

    // Act
    render(
      <LessonView
        view={{ ...view, nextLesson, lessons: [view.lesson, nextLesson] }}
        notes={null}
        notesResource={null}
      />,
    );

    // Assert — the closing card ends the rail, wrapping the action.
    const closingLink = within(rail()).getByRole("link", { name: /Next lesson title/ });
    expect(closingLink).toBeInTheDocument();
    expect(within(rail()).getByText("prompt")).toBeInTheDocument();
    expect(closingLink.closest("section")).toContainElement(
      screen.getByRole("button", { name: "markComplete" }),
    );

    // Outside the rail only the outline may name that lesson.
    const strayLinks = screen
      .getAllByRole("link", { name: /Next lesson title/ })
      .filter((link) => !rail().contains(link) && link.closest("nav") === null);
    expect(strayLinks).toHaveLength(0);

    // And the action itself is mounted exactly once on the page.
    expect(screen.getAllByRole("button", { name: "markComplete" })).toHaveLength(1);
  });

  test("WHEN rendered THEN the materials come once, right before the closing block", () => {
    // Arrange — both live in the rail, materials first; below `lg` the rail
    // follows `main`, so the order holds on a phone without a second copy.
    const { view } = fixtures();

    // Act
    render(
      <LessonView
        view={view}
        notes={null}
        notesResource={null}
      />,
    );

    // Assert — one copy, in the rail, ahead of the closing card.
    const materials = screen.getByText("PDF handout");
    const closingCard = screen.getByTestId("lesson-close-card");
    expect(rail()).toContainElement(materials);
    expect(
      materials.compareDocumentPosition(closingCard) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("main")).not.toContainElement(materials);
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

    // Act
    render(
      <LessonView
        view={readingView}
        notes={null}
        notesResource={null}
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
      />,
    );

    // Assert: no dedicated notes card, and the file is not folded into
    // Resources under the default heading either.
    expect(screen.queryByRole("region", { name: "resourceTitle" })).toBeNull();
    expect(screen.queryByText(notesResource.title)).toBeNull();
    expect(screen.queryByRole("link", { name: notesResource.title })).toBeNull();
    expect(within(rail()).getByText("PDF handout")).toBeInTheDocument();
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
      />,
    );

    // Assert: one card showing "no resources", not a second card beside it.
    expect(within(rail()).getByText("empty")).toBeInTheDocument();
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
      />,
    );

    // Assert
    expect(screen.getByTestId("lesson-notes-tabs")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "notes" })).toBeInTheDocument();
  });

  test("WHEN the lesson on screen becomes complete THEN a ticket notification is announced", async () => {
    // Arrange — a second lesson keeps the module unredeemed, so a ticket
    // notification rather than the prize dialog is the moment.
    const { view } = fixtures();
    const otherLesson = Lesson.parse({
      kind: "reading",
      id: LessonId.parse(faker.string.uuid()),
      courseId: view.course.id,
      moduleId: view.module.id,
      sequence: 2,
      title: "Other lesson",
      body: "body",
    });
    render(
      <LessonView
        view={{ ...view, lessons: [view.lesson, otherLesson] }}
        notes={null}
        notesResource={null}
      />,
    );
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    const ticketNotification = () =>
      screen.getAllByRole("status").find((status) => status.textContent?.includes("progress"));
    expect(ticketNotification()).toBeUndefined();

    // Act
    await act(() => markLessonComplete(view.lesson.id));

    // Assert
    expect(ticketNotification()).toBeDefined();
    await act(() => unmarkLessonComplete(view.lesson.id));
  });
});
