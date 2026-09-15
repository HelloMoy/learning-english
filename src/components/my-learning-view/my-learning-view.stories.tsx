import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import type { HomeLevel } from "@/components/home-view/home-view";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { LessonId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MyLearningView } from "./my-learning-view";

const basic = Course.parse({
  id: "00000000-0000-4000-8000-000000000100",
  slug: "basic-course",
  title: "Basic Course",
  description: "American pronunciation from the ground up: vowels, consonants and rhythm.",
  language: "en",
  sequence: 1,
  lessonCount: 48,
  moduleCount: 5,
});

const advanced = Course.parse({
  id: "00000000-0000-4000-8000-000000000101",
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description: "From single sounds to real speech: contractions, intonation and fast English.",
  language: "en",
  sequence: 2,
  lessonCount: 107,
  moduleCount: 6,
});

/** The Basic Course's five lessons and how many videos each holds. */
const LESSONS: ReadonlyArray<readonly [title: string, videos: number]> = [
  ["Introduction", 1],
  ["Vowels", 17],
  ["Consonants", 25],
  ["Rhythm drills", 4],
  ["Fluency & speed", 1],
];

const modules = LESSONS.map(([title], index) =>
  Module.parse({
    id: `00000000-0000-4000-8000-00000000020${index}`,
    courseId: basic.id,
    slug: `${index + 1}-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`,
    title,
    sequence: index + 1,
  }),
);

const lessonRuntimes = LESSONS.flatMap(([, videos], moduleIndex) =>
  Array.from({ length: videos }, (_, videoIndex) => ({
    id: LessonId.parse(
      `00000000-0000-4000-8${moduleIndex}00-${String(videoIndex).padStart(12, "0")}`,
    ),
    moduleId: modules[moduleIndex]!.id,
    durationSeconds: 480,
  })),
);

const levels: HomeLevel[] = [
  { course: basic, modules, lessonRuntimes },
  { course: advanced, modules: [], lessonRuntimes: [] },
];

const firstLesson = {
  href: `/courses/basic-course/modules/${modules[0]!.slug}/lessons/${lessonRuntimes[0]!.id}`,
  minutes: 8,
  courseTitle: basic.title,
};

const continuedLesson = lessonRuntimes.filter((slice) => slice.moduleId === modules[1]!.id)[5]!;

const panel: ContinueWatchingPanel = {
  courseSlug: basic.slug,
  courseTitle: basic.title,
  moduleId: modules[1]!.id,
  moduleSequence: 2,
  moduleTitle: "Vowels",
  lessonSequence: 6,
  lessonTitle: "The Vowel Sound Ae",
  lessonHref: `/courses/basic-course/modules/${modules[1]!.slug}/lessons/${continuedLesson.id}`,
  durationSeconds: 480,
};

/** Every fake is built once at module scope, so re-renders share one store. */
const learner: LearnerProfileRepository = {
  get: async () =>
    LearnerProfile.parse({ name: "Ana García", avatar: { kind: "illustration", id: "wave" } }),
  set: async () => {},
};

const nothingWatched: ContinueWatchingRepository = { get: async () => null, set: async () => {} };

const watchedVowels: ContinueWatchingRepository = {
  get: async () =>
    ContinueWatchingLocation.parse({
      courseSlug: basic.slug,
      moduleSlug: modules[1]!.slug,
      lessonId: continuedLesson.id,
    }),
  set: async () => {},
};

const fortyPercentIn: PlaybackPositionRepository = {
  getPosition: async () => 192,
  setPosition: async () => {},
};

const resolvesToVowels = async () => panel;
const neverResolves = () => new Promise<ContinueWatchingPanel | null>(() => {});

const meta = {
  title: "Components/MyLearningView",
  component: MyLearningView,
  args: {
    levels,
    firstLesson,
    profiles: learner,
    continueWatching: nothingWatched,
  },
  decorators: [
    (Story) => (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-12 sm:gap-28 sm:px-11">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof MyLearningView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Straight after onboarding: nothing watched, the first video offered. */
export const JustOnboarded: Story = {};

/** A learner six videos into Vowels, forty percent through the current one. */
export const Returning: Story = {
  args: {
    continueWatching: watchedVowels,
    resolve: resolvesToVowels,
    positions: fortyPercentIn,
  },
};

/** The stored record is still resolving: the panel is reserved. */
export const Resolving: Story = {
  args: { continueWatching: watchedVowels, resolve: neverResolves },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  args: {
    continueWatching: watchedVowels,
    resolve: resolvesToVowels,
    positions: fortyPercentIn,
  },
};

/** Phone width. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
  args: {
    continueWatching: watchedVowels,
    resolve: resolvesToVowels,
    positions: fortyPercentIn,
  },
};
