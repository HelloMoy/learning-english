import type { ContinueWatchingPanel } from "@/app/[locale]/actions";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ResumePanel } from "./resume-panel";

const panel: ContinueWatchingPanel = {
  courseSlug: "basic-course",
  courseTitle: "Basic Course",
  moduleId: "00000000-0000-4000-8000-000000000201",
  moduleSequence: 2,
  moduleTitle: "Vowels",
  lessonSequence: 6,
  lessonTitle: "The Vowel Sound Ae",
  lessonHref: "/courses/basic-course/modules/2-vowels/lessons/00000000-0000-4000-8000-000000000006",
  durationSeconds: 480,
};

const meta = {
  title: "Components/ResumePanel",
  component: ResumePanel,
  args: {
    panel,
    moduleLessonCount: 17,
    watchedFraction: 0.4,
    courseHref: "/courses/basic-course",
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResumePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A video part-watched: the bar shows how far in the learner got. */
export const PartWatched: Story = {};

/** A reading lesson, or a video never played: no bar. */
export const NothingToMeasure: Story = {
  args: { watchedFraction: null },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
