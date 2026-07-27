import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlayButton } from "./play-button";

const meta: Meta<typeof PlayButton> = {
  title: "Cinema/PlayButton",
  component: PlayButton,
  parameters: { backgrounds: { default: "dark" } },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
};

export default meta;
type Story = StoryObj<typeof PlayButton>;

export const Decorative: Story = { args: { decorative: true, size: "md" } };
export const Interactive: Story = {
  args: { decorative: false, label: "Play lesson", size: "lg" },
};
