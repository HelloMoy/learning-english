import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressRing } from "./progress-ring";

const meta = {
  title: "Components/ProgressRing",
  component: ProgressRing,
  args: { share: 0.24, label: "24%" },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A quarter of the way through. */
export const Partial: Story = {};

/** Nothing done: the track alone, with no dot where the arc would start. */
export const Empty: Story = {
  args: { share: 0, label: "0%" },
};

/** Everything done: a closed gold ring. */
export const Complete: Story = {
  args: { share: 1, label: "100%" },
};

/** Sized up, as the lead lesson card on My learning draws it. */
export const Large: Story = {
  args: { className: "size-[4.5rem]", labelClassName: "text-sm" },
};
