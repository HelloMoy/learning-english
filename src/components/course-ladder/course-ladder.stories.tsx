import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseLadder, type CourseLevel } from "./course-ladder";

const basic = Course.parse({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "english-a1-pronunciation",
  title: "Basic — Foundational Pronunciation",
  description:
    "Pronunciation fundamentals for English A1 learners: vowels, consonant clusters, and word stress.",
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
  sequence: 1,
});

const advanced = Course.parse({
  id: "6361a41b-29e4-5679-8207-445797ed8fa7",
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description:
    "American vowels, contractions and reductions, and the sound patterns of connected speech.",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
  sequence: 2,
});

const buildModule = (course: Course, sequence: number, title: string) =>
  Module.parse({
    id: `2d0d3f73-6afe-579b-8db7-517d76e6${course.sequence}${String(sequence).padStart(3, "0")}`,
    courseId: course.id,
    slug: `${sequence}-module`,
    title,
    sequence,
  });

const levels: CourseLevel[] = [
  {
    course: basic,
    leadingModules: [
      buildModule(basic, 1, "Vowels and video intro"),
      buildModule(basic, 2, "Consonants and stress"),
    ],
  },
  {
    course: advanced,
    leadingModules: [
      buildModule(advanced, 1, "Advanced Pronunciation Course"),
      buildModule(advanced, 2, "Advanced Vowel Pronunciation"),
      buildModule(advanced, 3, "Contractions Reductions"),
    ],
  },
];

/** A location store with one fixed answer, so a story can pick the state. */
const storedAt = (course: Course | null): ContinueWatchingRepository => ({
  get: async () =>
    course
      ? ContinueWatchingLocation.parse({
          courseSlug: course.slug,
          moduleSlug: "1-module",
          lessonId: "33333333-3333-4333-8333-333333333333",
        })
      : null,
  set: async () => {},
});

const meta: Meta<typeof CourseLadder> = {
  title: "Cinema/CourseLadder",
  component: CourseLadder,
  args: { levels, continueWatching: storedAt(null) },
};

export default meta;
type Story = StoryObj<typeof CourseLadder>;

/** A fresh learner: every card reads as not started, no node is lit. */
export const NothingStarted: Story = {};

/** The learner is part-way through the entry course. */
export const ContinuingBasic: Story = {
  args: { continueWatching: storedAt(basic) },
};

/** The learner is part-way through the advanced course. */
export const ContinuingAdvanced: Story = {
  args: { continueWatching: storedAt(advanced) },
};

/**
 * A one-course catalogue — the state the default dev boot serves. The ladder
 * renders a single rung with no empty slots and no placeholder for a course
 * that does not exist.
 */
export const SingleCourse: Story = {
  args: { levels: [levels[0]!] },
};

/**
 * A third course arriving. Nothing about the layout has to change to take it:
 * that is the point of the ladder.
 */
export const ThreeCourses: Story = {
  args: {
    levels: [
      ...levels.slice(0, 1),
      {
        course: Course.parse({
          ...advanced,
          id: "7361a41b-29e4-5679-8207-445797ed8fa7",
          slug: "intermediate-connected-speech",
          title: "Intermediate — Connected Speech",
          description: "The bridge between single sounds and natural, running speech.",
          lessonCount: 42,
          moduleCount: 6,
          sequence: 2,
        }),
        leadingModules: [buildModule(basic, 1, "Linking and intrusion")],
      },
      { ...levels[1]!, course: Course.parse({ ...advanced, sequence: 3 }) },
    ],
  },
};
