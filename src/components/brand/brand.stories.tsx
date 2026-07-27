import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Brand } from "./brand";

const meta: Meta<typeof Brand> = {
  title: "Cinema/Brand",
  component: Brand,
  parameters: { backgrounds: { default: "dark" } },
};

export default meta;
type Story = StoryObj<typeof Brand>;

export const Default: Story = {};
