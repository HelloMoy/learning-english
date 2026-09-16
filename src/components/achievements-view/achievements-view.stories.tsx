import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AchievementsView } from "./achievements-view";

const course = Course.parse({
  id: CourseId.parse("00000000-0000-4000-8000-00000000c001"),
  slug: "basic-course",
  title: "Basic Course",
  description: "Pronunciation foundations.",
  language: "en",
  lessonCount: 17,
  moduleCount: 1,
  sequence: 1,
});

const vowels = Module.parse({
  id: ModuleId.parse("00000000-0000-4000-8000-000000000202"),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 2,
});

/** The Vowels module's real titles, so the tickets carry real sounds. */
const VOWEL_TITLES = [
  "The Vowel Sound: /ə/ (El más importante)",
  "The Vowel Sound /ɪ/ (e corta)",
  "The Vowel Sound /ʊ/ (o corta)",
  "Schwa /ə/ or Strut /ʌ/ ?",
  "The weak-vowel merger",
  "The vowel sound /æ/ (a ligada)",
  "The vowel sound /ɑ/",
  "The Vowel sound /ɔ/",
  "The cot–caught merger!",
  "The Vowel Sound /ɛ/",
  "The Vowel Sound /u/",
  "The vowel sound /i/",
  "Diphthong Sound /aɪ/",
  "Diphthong Sound /aʊ/",
  "Diphthong Sound /ɔɪ/",
  "Diphthong Sound /eɪ/",
  "Diphthong Sound /ɔʊ/",
];

const lessonRuntimes = VOWEL_TITLES.map((title, index) => ({
  id: LessonId.parse(`00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`),
  moduleId: vowels.id,
  durationSeconds: 480,
  title,
  sequence: index + 1,
}));

const learner: LearnerProfileRepository = {
  get: async () =>
    LearnerProfile.parse({ name: "Ana García", avatar: { kind: "illustration", id: "wave" } }),
  set: async () => {},
};

/** Nothing started, so the page's way back offers the first lesson. */
const nothingStarted: ContinueWatchingRepository = {
  get: async () => null,
  set: async () => {},
};

const firstLesson = {
  href: `/courses/basic-course/modules/2-vowels/lessons/${lessonRuntimes[0]!.id}`,
  minutes: 8,
  courseTitle: "Basic Course",
};

const meta = {
  title: "Components/AchievementsView",
  component: AchievementsView,
  args: {
    profiles: learner,
    level: { number: 1, courseTitle: "Basic Course" },
    lessonRuntimes,
    levels: [{ course, modules: [vowels], lessonRuntimes }],
    firstLesson,
    continueWatching: nothingStarted,
  },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-11">
          <Story />
        </main>
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<typeof AchievementsView>;

export default meta;
type Story = StoryObj<typeof meta>;

const continuedLesson = lessonRuntimes[3]!;

/** A learner with a lesson under way, so the way back leads into that lesson. */
const continuing: ContinueWatchingRepository = {
  get: async () =>
    ContinueWatchingLocation.parse({
      courseSlug: course.slug,
      moduleSlug: vowels.slug,
      lessonId: continuedLesson.id,
    }),
  set: async () => {},
};

const resolveContinued = async (): Promise<ContinueWatchingPanel> => ({
  courseSlug: course.slug,
  courseTitle: course.title,
  moduleId: vowels.id,
  moduleSequence: vowels.sequence,
  moduleTitle: vowels.title,
  lessonSequence: continuedLesson.sequence,
  lessonTitle: continuedLesson.title,
  lessonHref: `/courses/${course.slug}/modules/${vowels.slug}/lessons/${continuedLesson.id}`,
  durationSeconds: 480,
});

/**
 * A learner with nothing completed on this device: every ticket still to earn,
 * and the way back offers the course's first lesson.
 */
export const Default: Story = {};

/** With a lesson already under way, the action continues the course into it. */
export const WithSomethingToContinue: Story = {
  args: { continueWatching: continuing, resolve: resolveContinued },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width: the card leads, the prize shelf follows two to a row. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
