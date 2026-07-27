import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Eyebrow } from "./eyebrow";

const meta: Meta<typeof Eyebrow> = {
  title: "Cinema/Eyebrow",
  component: Eyebrow,
  parameters: { backgrounds: { default: "dark" } },
  args: { children: "Now streaming · Spoken English" },
};

export default meta;
type Story = StoryObj<typeof Eyebrow>;

export const Default: Story = {};
