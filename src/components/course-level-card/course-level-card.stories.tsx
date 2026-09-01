import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CourseLevelCard } from "./course-level-card";

const course = Course.parse({
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

const buildModule = (sequence: number, title: string) =>
  Module.parse({
    id: `2d0d3f73-6afe-579b-8db7-517d76e650${String(sequence).padStart(2, "0")}`,
    courseId: course.id,
    slug: `${sequence}-${title.toLowerCase().replaceAll(" ", "-")}`,
    title,
    sequence,
  });

const leadingModules = [
  buildModule(1, "Advanced Pronunciation Course"),
  buildModule(2, "Advanced Vowel Pronunciation"),
  buildModule(3, "Contractions Reductions"),
];

const meta: Meta<typeof CourseLevelCard> = {
  title: "Cinema/CourseLevelCard",
  component: CourseLevelCard,
  args: { course, leadingModules, state: "not-started" },
  // The card fills its grid cell on the home; a fixed frame here keeps the
  // module list at the width it really gets rather than the full canvas.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CourseLevelCard>;

/** A course the learner has not opened yet. */
export const NotStarted: Story = {};

/**
 * The course the continue-watching record points at: gold border, a marked
 * badge, and a call to action that invites continuing rather than starting.
 */
export const InProgress: Story = {
  args: { state: "in-progress" },
};

/**
 * A short course whose preview covers every module, so the `+N more` line has
 * nothing to report and is omitted rather than rendered as `+0 more`.
 */
export const EveryModulePreviewed: Story = {
  args: {
    course: Course.parse({ ...course, moduleCount: 3, lessonCount: 18, sequence: 1 }),
  },
};

/**
 * The longest real title in the catalogue, at the narrowest width the grid
 * gives a card. The ordinal sits outside the title, so it survives the
 * truncation the title does not.
 */
export const LongTitles: Story = {
  args: {
    leadingModules: [
      buildModule(1, "Advanced Vowel Pronunciation In American English"),
      buildModule(2, "Key Sound Patterns And Features Of Connected Speech"),
      buildModule(3, "Contractions Reductions"),
    ],
  },
};
