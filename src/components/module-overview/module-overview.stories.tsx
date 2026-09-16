import {
  seedVowelsPrizeClaimed,
  seedVowelsProgress,
  vowelsCourse,
  vowelsLessons,
  vowelsModule,
} from "@/components/module-route/module-route.fixtures";
import { Lesson } from "@/domain/entities/lesson/lesson";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleOverview } from "./module-overview";

const meta = {
  title: "Components/ModuleOverview",
  component: ModuleOverview,
  decorators: [
    (Story) => (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-11 sm:py-12">
        <Story />
      </main>
    ),
  ],
  args: {
    course: vowelsCourse,
    module: vowelsModule,
    lessons: vowelsLessons,
  },
} satisfies Meta<typeof ModuleOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The module page for a learner who has not started it. */
export const Default: Story = {
  beforeEach: () => seedVowelsProgress(0, 0),
};

/** Videos 1–5 finished and video 6 at 40%. */
export const ReturningLearner: Story = {
  beforeEach: () => seedVowelsProgress(5, 0.4),
};

/** Every video finished: the hidden prize waits to be claimed, in the panel and at the end of the route. */
export const PrizeReady: Story = {
  beforeEach: () => seedVowelsProgress(vowelsLessons.length, 0),
};

/** The prize claimed on the counter: the harmonica is revealed on the module page. */
export const PrizeClaimed: Story = {
  beforeEach: () => seedVowelsPrizeClaimed(),
};

const SHARED_PREFIX_LESSON_COUNT = 6;

const sharedPrefixLessons = vowelsLessons
  .slice(0, SHARED_PREFIX_LESSON_COUNT)
  .map((lesson, index) =>
    Lesson.parse({ ...lesson, title: `Exercise ${index + 1} Pronunciation Step By Step Lesson` }),
  );

/**
 * Titles sharing a long prefix at 320px. Cut to one line on a phone every step
 * would read "Exercise 1 Pronunciati…", so titles must wrap in full.
 */
export const SharedPrefixTitlesOnPhone: Story = {
  args: { lessons: sharedPrefixLessons },
  beforeEach: () => seedVowelsProgress(2, 0.4),
  parameters: {
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};
