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
    track: "level",
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
    track: "level",
    sequence: 2,
  },
].map((course, index) => ({
  course: Course.parse(course),
  standing: { kind: "level", number: index + 1 } as const,
}));

const referenceCourses = [
  {
    course: Course.parse({
      id: "00000000-0000-4000-8000-000000000303",
      slug: "atlas-of-american-sounds",
      title: "Atlas of American Sounds",
      description:
        "Every sound of American English, one lesson each: vowels, diphthongs, r-colored vowels and consonants, with overviews and minimal-pair drills. Videos by the Sounds American channel.",
      language: "en",
      lessonCount: 63,
      moduleCount: 12,
      track: "reference",
      sequence: 3,
    }),
    standing: { kind: "reference" } as const,
  },
];

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

/** The reference courses listed on their own, outside the levels: each row reads Reference. */
export const ReferenceCourses: Story = {
  args: { courses: referenceCourses, listing: "reference" },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width: each row stacks. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
