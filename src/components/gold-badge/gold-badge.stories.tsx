import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GoldBadge } from "./gold-badge";

const meta: Meta<typeof GoldBadge> = {
  title: "Cinema/GoldBadge",
  component: GoldBadge,
  parameters: { backgrounds: { default: "dark" } },
  args: { children: "10 modules · 107 lessons", variant: "gold" },
  argTypes: { variant: { control: "inline-radio", options: ["gold", "neutral"] } },
};

export default meta;
type Story = StoryObj<typeof GoldBadge>;

export const Gold: Story = {};
export const Neutral: Story = { args: { children: "Module", variant: "neutral" } };
