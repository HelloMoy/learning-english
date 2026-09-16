import { LessonId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { CourseProgressList } from "./course-progress-list";

const COURSE_ID = "00000000-0000-4000-8000-000000000100";

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
    courseId: COURSE_ID,
    slug: `module-${index + 1}`,
    title,
    sequence: index + 1,
  }),
);

const lessonRuntimes: LessonProgressSlice[] = LESSONS.flatMap(([, videos], moduleIndex) =>
  Array.from({ length: videos }, (_, videoIndex) => ({
    id: LessonId.parse(
      `00000000-0000-4000-8${moduleIndex}00-${String(videoIndex).padStart(12, "0")}`,
    ),
    moduleId: modules[moduleIndex]!.id,
    durationSeconds: 480,
    title: `Video ${videoIndex + 1}`,
    sequence: videoIndex + 1,
  })),
);

const continuedVideo = lessonRuntimes.find((slice) => slice.moduleId === modules[1]!.id)!;

const meta = {
  title: "Components/CourseProgressList",
  component: CourseProgressList,
  args: {
    courseSlug: "basic-course",
    courseTitle: "Basic Course",
    modules,
    lessonRuntimes,
    continued: {
      moduleId: modules[1]!.id,
      lessonTitle: "The weak-vowel merger",
      lessonHref: `/courses/basic-course/modules/module-2/lessons/${continuedVideo.id}`,
    },
  },
} satisfies Meta<typeof CourseProgressList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A learner in the second lesson, whose card leads with Continue. Counts read
 * this browser's saved progress, so a fresh Storybook shows every ring at 0% —
 * which is the honest reading.
 */
export const CurrentlyInVowels: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("link", { name: "Continue" })).toHaveLength(1);
  },
};

/** Nothing continued yet: every card in order, none offering Continue. */
export const NothingContinued: Story = {
  args: { continued: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("link", { name: "Continue" })).toBeNull();
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width: the cards stack in one column, the lead card's action under its text. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
