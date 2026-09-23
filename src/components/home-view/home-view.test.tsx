import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { HomeView, type HomeLevel } from "./home-view";

const buildCourse = (overrides: {
  slug: string;
  title: string;
  sequence: number;
  lessonCount: number;
  moduleCount: number;
}) =>
  Course.parse({
    id: faker.string.uuid(),
    description: faker.lorem.sentence(),
    language: "en",
    ...overrides,
  });

const basic = buildCourse({
  slug: "basic-course",
  title: "Basic Course",
  sequence: 1,
  lessonCount: 3,
  moduleCount: 2,
});
const advanced = buildCourse({
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  sequence: 2,
  lessonCount: 0,
  moduleCount: 0,
});

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
  title: faker.lorem.words(3),
  sequence: faker.number.int({ min: 1, max: 30 }),
});

const introductionLesson = slice(introduction.id);

const levels: HomeLevel[] = [
  {
    course: basic,
    modules: [introduction, vowels],
    lessonRuntimes: [introductionLesson, slice(vowels.id), slice(vowels.id)],
  },
  { course: advanced, modules: [], lessonRuntimes: [] },
];

const firstLesson = {
  href: `/courses/basic-course/modules/module-1/lessons/${introductionLesson.id}`,
  minutes: 8,
  courseTitle: "Basic Course",
};

const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });

beforeEach(() => {
  window.localStorage.clear();
});

describe("HomeView", () => {
  describe("GIVEN a device without a learner profile", () => {
    test("WHEN rendered THEN the landing leads, answers questions, lists levels and closes with the offer", () => {
      renderInLocale(
        <HomeView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository()}
        />,
      );

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Learn American English one sound at a time.",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Three questions learners ask first" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "2 levels, in order" })).toBeInTheDocument();
      expect(
        within(screen.getByRole("list", { name: "Available courses, in order" })).getAllByRole(
          "listitem",
        ),
      ).toHaveLength(2);
      expect(
        screen.getByRole("heading", {
          name: "8 minutes to find out what your ear has been missing.",
        }),
      ).toBeInTheDocument();
    });

    test("WHEN rendered THEN the hero and the closing band both start the course through the onboarding", async () => {
      renderInLocale(
        <HomeView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository()}
        />,
      );

      const starts = screen.getAllByRole("link", { name: "Start course" });
      expect(starts).toHaveLength(2);
      await waitFor(() => {
        for (const start of starts) expect(start).toHaveAttribute("href", "/start");
      });
    });

    test("WHEN rendered THEN the hero's note names the first course and its video count", () => {
      renderInLocale(
        <HomeView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository()}
        />,
      );

      expect(screen.getByText("3 videos · Basic Course")).toBeInTheDocument();
    });
  });

  describe("GIVEN a device with a learner profile", () => {
    test("WHEN rendered THEN both actions read Continue and open My learning", async () => {
      renderInLocale(
        <HomeView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository({ profile })}
        />,
      );

      await waitFor(() => {
        const continues = screen.getAllByRole("link", { name: "Continue" });
        expect(continues).toHaveLength(2);
        for (const action of continues) {
          expect(action).toHaveAttribute("href", "/learning");
        }
      });
    });
  });

  describe("GIVEN a device with a learner profile, at the closing band", () => {
    test("WHEN rendered THEN the band greets the learner with their card instead of restating the offer", async () => {
      renderInLocale(
        <HomeView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository({ profile })}
        />,
      );

      expect(
        await screen.findByRole("heading", { level: 2, name: "Pick up where you left off, Ana." }),
      ).toBeInTheDocument();
      expect(screen.getByText("0 of 3 videos")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          name: "8 minutes to find out what your ear has been missing.",
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a device holding a continue-watching record", () => {
    test("WHEN rendered THEN the landing stays and no returning-learner content appears", async () => {
      givenLearner.continueWatching(
        ContinueWatchingLocation.parse({
          courseSlug: basic.slug,
          moduleSlug: vowels.slug,
          lessonId: faker.string.uuid(),
        }),
      );

      renderInLocale(
        <HomeView
          levels={levels}
          firstLesson={firstLesson}
          profiles={makeStubLearnerProfileRepository({ profile })}
        />,
      );

      await waitFor(() =>
        expect(screen.getAllByRole("link", { name: "Continue" })[0]).toHaveAttribute(
          "href",
          "/learning",
        ),
      );
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.queryByText("Welcome back")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Resume" })).not.toBeInTheDocument();
    });
  });

  describe("GIVEN an empty catalog", () => {
    test("WHEN rendered THEN a localized empty state replaces the home", () => {
      renderInLocale(
        <HomeView
          levels={[]}
          firstLesson={null}
          profiles={makeStubLearnerProfileRepository()}
        />,
      );

      expect(screen.getByRole("status")).toHaveTextContent("No courses are available right now.");
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    });
  });
});
