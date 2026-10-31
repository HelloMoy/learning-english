import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { List } from "lucide-react";

import { CompletionRing } from "./completion-ring";

const meta = {
  title: "LessonView/CompletionRing",
  component: CompletionRing,
  args: { size: 24, fraction: 0.67 },
  decorators: [
    (Story) => (
      <div className="inline-flex rounded-2xl bg-card p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompletionRing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A lesson row two thirds of the way through its videos. */
export const Partial: Story = {};

/** A lesson nobody has started, or one whose progress is not known yet: the track alone. */
export const Empty: Story = { args: { fraction: 0 } };

/** Every video done: the fill closes the circle. */
export const Full: Story = { args: { fraction: 1 } };

/** The mobile row's tile once there is a reading. */
export const WithPercentage: Story = {
  args: {
    size: 44,
    fraction: 0.33,
    children: <span className="font-mono text-[11px] font-semibold text-foreground">33%</span>,
  },
};

/** The mobile row's tile before there is a reading. */
export const WithIcon: Story = {
  args: {
    size: 44,
    fraction: 0,
    children: (
      <List
        aria-hidden="true"
        className="size-5 text-gold"
      />
    ),
  },
};
