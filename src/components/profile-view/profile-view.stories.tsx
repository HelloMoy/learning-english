import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Module } from "@/domain/entities/module/module";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ProfileView } from "./profile-view";

const moduleId = ModuleId.parse("00000000-0000-4000-8000-000000000201");

const course = Course.parse({
  id: CourseId.parse("00000000-0000-4000-8000-000000000101"),
  slug: "basic-course",
  title: "Basic Course",
  description: "The sounds of American English.",
  language: "en",
  lessonCount: 48,
  moduleCount: 1,
  sequence: 1,
});

const vowels = Module.parse({
  id: moduleId,
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 1,
});

/** Forty-eight videos, like the Basic Course. */
const lessonRuntimes = Array.from({ length: 48 }, (_, index) => ({
  id: LessonId.parse(`00000000-0000-4000-8000-${String(index).padStart(12, "0")}`),
  moduleId,
  durationSeconds: 480,
  title: `Video ${index + 1}`,
  sequence: index + 1,
}));

const levels = [{ course, modules: [vowels], lessonRuntimes }];

/** The twelve videos a part-way learner has watched, with their tickets. */
const watched = lessonRuntimes.slice(0, 12).map((lesson) => lesson.id);

/**
 * A learner's stored card. Module scope, so every render shares one store;
 * saves are kept in memory for the life of the Storybook tab.
 */
let stored = LearnerProfile.parse({
  name: "Ana García",
  avatar: { kind: "illustration", id: "wave" },
});
const learner: LearnerProfileRepository = {
  get: async () => stored,
  set: async (profile) => {
    stored = profile;
  },
};

const meta = {
  title: "Components/ProfileView",
  component: ProfileView,
  args: {
    profiles: learner,
    level: { number: 1, courseTitle: "Basic Course" },
    lessonRuntimes,
    levels,
    account: {
      name: "Ana García",
      email: "ana@example.com",
      signInMethods: ["password"],
    },
  },
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.completed(watched);
    givenLearner.earnedTickets(watched);
    givenLearner.claimedPrizes([vowels.slug]);
    return () => resetLearnerStore();
  },
  decorators: [
    (Story) => (
      <main className="mx-auto w-full max-w-7xl px-4 pt-12 pb-32 sm:px-11">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ProfileView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The stored card, nothing edited: no save bar at all. */
export const Default: Story = {};

/** Picking another avatar previews it on the card and raises the save bar. */
export const EditingTheAvatar: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("radio", { name: "Plum" }));
    await expect(canvas.getByRole("button", { name: "Save changes" })).toBeEnabled();
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width: the card and its progress lead, the sections follow. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
