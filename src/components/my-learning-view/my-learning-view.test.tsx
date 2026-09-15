import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import type { HomeLevel } from "@/components/home-view/home-view";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { useRouter } from "@/i18n/navigation";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { MyLearningView } from "./my-learning-view";

const buildCourse = (slug: string, title: string, sequence: number) =>
  Course.parse({
    id: faker.string.uuid(),
    slug,
    title,
    description: faker.lorem.sentence(),
    language: "en",
    sequence,
    lessonCount: 3,
    moduleCount: 2,
  });

const basic = buildCourse("basic-course", "Basic Course", 1);
const advanced = buildCourse("advanced-intermediate-course", "Advanced Intermediate Course", 2);

const buildModule = (sequence: number, title: string) =>
  Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: basic.id,
    slug: `module-${sequence}`,
    title,
    sequence,
  });

const introduction = buildModule(1, "Introduction");
const vowels = buildModule(2, "Vowels");

const slice = (moduleId: ModuleId) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId,
  durationSeconds: 480,
});

const introductionLesson = slice(introduction.id);
const vowelLessons = [slice(vowels.id), slice(vowels.id)];

const levels: HomeLevel[] = [
  {
    course: basic,
    modules: [introduction, vowels],
    lessonRuntimes: [introductionLesson, ...vowelLessons],
  },
  { course: advanced, modules: [], lessonRuntimes: [] },
];

const firstLesson = {
  href: `/courses/basic-course/modules/module-1/lessons/${introductionLesson.id}`,
  minutes: 8,
  courseTitle: "Basic Course",
};

const continuedLesson = vowelLessons[0]!;

const location = ContinueWatchingLocation.parse({
  courseSlug: basic.slug,
  moduleSlug: vowels.slug,
  lessonId: continuedLesson.id,
});

const panel: ContinueWatchingPanel = {
  courseSlug: basic.slug,
  courseTitle: basic.title,
  moduleId: vowels.id,
  moduleSequence: vowels.sequence,
  moduleTitle: vowels.title,
  lessonSequence: 1,
  lessonTitle: "The Vowel Sound Schwa",
  lessonHref: `/courses/basic-course/modules/module-2/lessons/${continuedLesson.id}`,
  durationSeconds: 480,
};

const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });

const storing = (stored: ContinueWatchingLocation | null): ContinueWatchingRepository => ({
  get: async () => stored,
  set: async () => {},
});

const watchedFor = (seconds: number | null): PlaybackPositionRepository => ({
  getPosition: async () => seconds,
  setPosition: async () => {},
});

const neverAnswers = () => new Promise<ContinueWatchingPanel | null>(() => {});

const router = { replace: vi.fn(), push: vi.fn() };

beforeEach(() => {
  window.localStorage.clear();
  router.replace.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

describe("MyLearningView", () => {
  describe("GIVEN storage has not answered yet", () => {
    test("WHEN first rendered THEN a shell stands in and no learner is greeted", () => {
      renderInLocale(
        <MyLearningView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository({ profile })}
          continueWatching={storing(null)}
        />,
      );

      expect(screen.getByTestId("my-learning-shell")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a device without a learner profile", () => {
    test("WHEN rendered THEN the learner is sent to the onboarding", async () => {
      renderInLocale(
        <MyLearningView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository()}
          continueWatching={storing(null)}
        />,
      );

      await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/start"));
    });
  });

  describe("GIVEN a learner with nothing watched", () => {
    const renderFresh = () =>
      renderInLocale(
        <MyLearningView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository({ profile })}
          continueWatching={storing(null)}
        />,
      );

    test("WHEN rendered THEN it greets the learner by first name beside their avatar", async () => {
      renderFresh();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Welcome back, Ana." }),
      ).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Avatar: Ana García" })).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
    });

    test("WHEN rendered THEN the panel offers the first video and the first course's progress is listed", async () => {
      renderFresh();

      expect(await screen.findByRole("link", { name: "Watch the first video" })).toHaveAttribute(
        "href",
        expect.stringContaining(firstLesson.href),
      );
      const lessons = screen.getByRole("list", { name: "Lessons in Basic Course" });
      expect(within(lessons).queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
    });

    test("WHEN rendered THEN every course is listed and none is marked in progress", async () => {
      renderFresh();

      const table = await screen.findByRole("list", { name: "Available courses, in order" });
      for (const link of within(table).getAllByRole("link")) {
        expect(link).toHaveAccessibleName("View course");
      }
    });
  });

  describe("GIVEN a stored record that has not resolved yet", () => {
    test("WHEN rendered THEN the panel is reserved and names no lesson", async () => {
      renderInLocale(
        <MyLearningView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository({ profile })}
          continueWatching={storing(location)}
          resolve={neverAnswers}
        />,
      );

      await screen.findByRole("heading", { level: 1, name: "Welcome back, Ana." });
      await waitFor(() => expect(screen.getByTestId("resume-panel-skeleton")).toBeInTheDocument());
      expect(screen.queryByRole("link", { name: "Resume" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Watch the first video" })).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a stored record that resolves to a live lesson", () => {
    const renderReturning = (positions = watchedFor(null)) =>
      renderInLocale(
        <MyLearningView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository({ profile })}
          continueWatching={storing(location)}
          resolve={async () => panel}
          positions={positions}
        />,
      );

    test("WHEN rendered THEN Resume returns to the lesson and states its position", async () => {
      renderReturning();

      expect(await screen.findByRole("link", { name: "Resume" })).toHaveAttribute(
        "href",
        expect.stringContaining(panel.lessonHref),
      );
      expect(
        screen.getByText("Basic Course · Lesson 2 · Vowels · Video 1 of 2"),
      ).toBeInTheDocument();
    });

    test("WHEN rendered THEN the continued lesson's card leads and continues that video", async () => {
      renderReturning();

      await screen.findByRole("link", { name: "Resume" });
      const [lead] = within(
        screen.getByRole("list", { name: "Lessons in Basic Course" }),
      ).getAllByRole("listitem");
      expect(lead).toHaveTextContent(`Last watched: ${panel.lessonTitle}`);
      expect(within(lead!).getByRole("link", { name: "Continue" })).toHaveAttribute(
        "href",
        expect.stringContaining(panel.lessonHref),
      );
    });

    test("WHEN rendered THEN only the continued course invites the learner to continue", async () => {
      renderReturning();

      await screen.findByRole("link", { name: "Resume" });
      const table = screen.getByRole("list", { name: "Available courses, in order" });
      const [basicRow, advancedRow] = within(table).getAllByRole("listitem");
      expect(within(basicRow!).getByRole("link")).toHaveAccessibleName("Continue course");
      expect(within(advancedRow!).getByRole("link")).toHaveAccessibleName("View course");
    });

    test("WHEN a playback position is saved THEN the panel draws how far in the learner got", async () => {
      renderReturning(watchedFor(240));

      expect(await screen.findByRole("progressbar", { name: "Playback progress" })).toHaveAttribute(
        "aria-valuenow",
        "50",
      );
    });
  });

  describe("GIVEN an empty catalog", () => {
    test("WHEN rendered THEN a localized empty state is shown", async () => {
      renderInLocale(
        <MyLearningView
          levels={[]}
          firstLesson={null}
          profiles={makeStubLearnerProfileRepository({ profile })}
          continueWatching={storing(null)}
        />,
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "No courses are available right now.",
      );
    });
  });
});
