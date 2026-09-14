import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleProgressPanel } from "./module-progress-panel";

const SECONDS_PER_MINUTE = 60;

const meta = {
  title: "Components/ModuleProgressPanel",
  component: ModuleProgressPanel,
  decorators: [
    (Story) => (
      <div className="w-[340px] p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    reading: {
      isRead: true,
      route: { steps: [], finishedCount: 5, lessonCount: 17, secondsLeft: 98 * SECONDS_PER_MINUTE },
    },
  },
} satisfies Meta<typeof ModuleProgressPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five of seventeen videos finished, with 1 h 38 min left to watch. */
export const InProgress: Story = {};

/** Every video finished: the panel says so in words and states no time left. */
export const Completed: Story = {
  args: {
    reading: {
      isRead: true,
      route: { steps: [], finishedCount: 17, lessonCount: 17, secondsLeft: 0 },
    },
  },
};

/** The server-rendered frame: heading and empty ring, no figures. */
export const BeforeProgressIsRead: Story = {
  args: { reading: { isRead: false } },
};
