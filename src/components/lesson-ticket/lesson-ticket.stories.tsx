import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonTicket } from "./lesson-ticket";

const meta = {
  title: "Components/LessonTicket",
  component: LessonTicket,
  args: { symbol: "ɪ", size: "md" },
  argTypes: {
    size: { control: { type: "select" }, options: ["sm", "md"] },
  },
} satisfies Meta<typeof LessonTicket>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The ticket a notification drops. */
export const Default: Story = {};

/** A diphthong still fits the paper. */
export const Diphthong: Story = {
  args: { symbol: "aɪ" },
};

/** The small ticket used as an inline example. */
export const Small: Story = {
  args: { size: "sm" },
};

/** A title without a sound falls back to the lesson's position. */
export const PositionFallback: Story = {
  args: { symbol: "5" },
};
