import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleRoute } from "./module-route";
import {
  seedVowelsPrizeClaimed,
  seedVowelsProgress,
  vowelsCourse,
  vowelsLessons,
  vowelsModule,
} from "./module-route.fixtures";

const meta = {
  title: "Components/ModuleRoute",
  component: ModuleRoute,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-7xl p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    course: vowelsCourse,
    module: vowelsModule,
    lessons: vowelsLessons,
    nextLesson: { sequence: 3, href: "/courses/basic-course/modules/3-consonants" },
  },
} satisfies Meta<typeof ModuleRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A learner who never opened the module: video 1 is featured with "Start video". */
export const NewLearner: Story = {
  beforeEach: () => seedVowelsProgress(0, 0),
};

/**
 * Videos 1–5 finished and video 6 at 40%: the route the design canvas shows,
 * ending at the harmonica's silhouette with 5 of 17 tickets.
 */
export const ReturningLearner: Story = {
  beforeEach: () => seedVowelsProgress(5, 0.4),
};

/**
 * Every video finished: nothing is featured, the panel says the lesson is
 * completed, and the prize — still hidden — waits to be claimed on the counter.
 */
export const CompletedModule: Story = {
  beforeEach: () => seedVowelsProgress(vowelsLessons.length, 0),
};

/** Every video finished and the prize claimed: the harmonica is revealed in the panel and at the end of the route. */
export const PrizeClaimed: Story = {
  beforeEach: () => seedVowelsPrizeClaimed(),
};

/** Eleven videos finished and the twelfth at 35%: the prize still collecting, as in the design canvas. */
export const CollectingPrize: Story = {
  beforeEach: () => seedVowelsProgress(11, 0.35),
};

/** Every video finished at iPhone width: the claim sits in the panel above the route and again at its end. */
export const ReadyPrizeOnPhone: Story = {
  beforeEach: () => seedVowelsProgress(vowelsLessons.length, 0),
  parameters: {
    viewport: {
      options: { iphone: { name: "390px", styles: { width: "390px", height: "844px" } } },
    },
  },
  globals: { viewport: { value: "iphone" } },
};

/** The same returning learner at iPhone width: the panel sits above the route. */
export const ReturningLearnerOnPhone: Story = {
  beforeEach: () => seedVowelsProgress(5, 0.4),
  parameters: {
    viewport: {
      options: { iphone: { name: "390px", styles: { width: "390px", height: "844px" } } },
    },
  },
  globals: { viewport: { value: "iphone" } },
};
