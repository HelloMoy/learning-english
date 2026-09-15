import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressRing } from "./progress-ring";

const meta = {
  title: "Components/ProgressRing",
  component: ProgressRing,
  args: { size: 220, fraction: 0.12 },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A module three videos into twenty-five. */
export const Fraction: Story = {
  args: {
    children: <span className="text-5xl font-black">12%</span>,
  },
};

/** A finished module: the fill closes the circle. */
export const Complete: Story = {
  args: { fraction: 1, children: <span className="text-5xl font-black">100%</span> },
};

/** A module not yet started: one dash per video, the first one lit. */
export const Segments: Story = {
  args: {
    fraction: undefined,
    segments: 25,
    children: <span className="text-5xl font-black">25</span>,
  } as never,
};

/** The phone size used under the carousel. */
export const Small: Story = {
  args: { size: 170, children: <span className="text-4xl font-black">12%</span> },
};
