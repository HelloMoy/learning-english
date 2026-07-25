import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PracticeTrackSummary } from "./practice-track";

const meta: Meta<typeof PracticeTrackSummary> = {
  title: "Components/PracticeTrackSummary",
  component: PracticeTrackSummary,
  args: {
    moduleCount: 10,
    label: "Course modules in order",
  },
};

export default meta;

type Story = StoryObj<typeof PracticeTrackSummary>;

export const Default: Story = {};

export const SmallCourse: Story = {
  args: { moduleCount: 3 },
};
