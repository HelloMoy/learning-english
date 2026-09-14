import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleRoute } from "./module-route";
import {
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
  },
} satisfies Meta<typeof ModuleRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A learner who never opened the module: video 1 is featured with "Start video". */
export const NewLearner: Story = {
  beforeEach: () => seedVowelsProgress(0, 0),
};

/** Videos 1–5 finished and video 6 at 40%: the route the design canvas shows. */
export const ReturningLearner: Story = {
  beforeEach: () => seedVowelsProgress(5, 0.4),
};

/** Every video finished: nothing is featured and the panel says the lesson is completed. */
export const CompletedModule: Story = {
  beforeEach: () => seedVowelsProgress(vowelsLessons.length, 0),
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
