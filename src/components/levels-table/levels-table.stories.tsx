import { Course } from "@/domain/entities/course/course";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LevelsTable } from "./levels-table";

const courses = [
  {
    id: "00000000-0000-4000-8000-000000000301",
    slug: "basic-course",
    title: "Basic Course",
    description:
      "American pronunciation from the ground up: vowel and consonant sounds, rhythm drills, and fluency practice.",
    language: "en",
    lessonCount: 48,
    moduleCount: 5,
    sequence: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000302",
    slug: "advanced-intermediate-course",
    title: "Advanced Intermediate Course",
    description:
      "From single sounds to real speech: contractions and reductions, American intonation, the rules of fast natural English, and everyday phrases.",
    language: "en",
    lessonCount: 107,
    moduleCount: 10,
    sequence: 2,
  },
].map((course) => Course.parse(course));

const meta = {
  title: "Components/LevelsTable",
  component: LevelsTable,
  args: { courses, continued: null },
} satisfies Meta<typeof LevelsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What a new visitor sees: every level with its counts and one link. */
export const NewVisitor: Story = {};

/** A returning learner six videos into the Basic Course. */
export const ContinuingTheBasicCourse: Story = {
  args: { continued: { courseSlug: "basic-course", completedCount: 6 } },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width: each row stacks. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
