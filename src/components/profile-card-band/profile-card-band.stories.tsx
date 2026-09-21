import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import { resetLearnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileCardBand } from "./profile-card-band";

const course = Course.parse({
  id: CourseId.parse("3f6b1c2d-8e4a-4f5b-9c1d-2a3b4c5d6e7f"),
  slug: "basic-course",
  title: "Basic Course",
  description: "The sounds of American English.",
  language: "en",
  lessonCount: 8,
  moduleCount: 1,
  sequence: 1,
});

const vowels = Module.parse({
  id: ModuleId.parse("4a7c2d3e-9f5b-4a6c-8d2e-3b4c5d6e7f80"),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 1,
});

const lessonRuntimes = Array.from({ length: 8 }, (_, index) => ({
  id: LessonId.parse(`5b8d3e4f-0a6c-4b7d-9e3f-4c5d6e7f8${String(index).padStart(3, "0")}`),
  moduleId: vowels.id,
  durationSeconds: 300,
  title: `Video ${index + 1}`,
  sequence: index + 1,
}));

const levels = [{ course, modules: [vowels], lessonRuntimes }];

const watched = (count: number) => lessonRuntimes.slice(0, count).map((lesson) => lesson.id);

const meta = {
  title: "Components/ProfileCardBand",
  component: ProfileCardBand,
  parameters: { layout: "padded" },
  args: {
    name: "Ana García",
    avatar: { kind: "illustration", id: "wave" },
    level: { number: 1, courseTitle: course.title },
    lessonRuntimes,
    levels,
  },
  beforeEach: () => {
    resetLearnerStore();
    return () => resetLearnerStore();
  },
} satisfies Meta<typeof ProfileCardBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A learner who has just made their card: every figure is zero. */
export const NewLearner: Story = {};

/** Two videos in, with their tickets and the module's prize claimed. */
export const PartWayThrough: Story = {
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.completed(watched(2));
    givenLearner.earnedTickets(watched(2));
    givenLearner.claimedPrizes([vowels.slug]);
    return () => resetLearnerStore();
  },
};

/** The level finished: the ring is full and every ticket is earned. */
export const LevelFinished: Story = {
  beforeEach: () => {
    resetLearnerStore();
    givenLearner.completed(watched(8));
    givenLearner.earnedTickets(watched(8));
    givenLearner.claimedPrizes([vowels.slug]);
    return () => resetLearnerStore();
  },
};

/** The same half-finished learner, reading in Spanish. */
export const InSpanish: Story = {
  ...PartWayThrough,
  parameters: { locale: "es" },
};

/** And in Portuguese, where the labels are longest. */
export const InPortuguese: Story = {
  ...PartWayThrough,
  parameters: { locale: "pt" },
};
