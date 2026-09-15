import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { ThemeSwitchTrack } from "./theme-switch-track";

const meta = {
  title: "Components/ThemeSwitchTrack",
  component: ThemeSwitchTrack,
  args: { isDark: true },
  parameters: { layout: "centered" },
} satisfies Meta<typeof ThemeSwitchTrack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The thumb at the dark end, wearing the moon. */
export const Dark: Story = {};

/** The thumb at the light end, wearing the sun. */
export const Light: Story = {
  args: { isDark: false },
};

/** Click the button to watch the slide. Visual only: the real control is `ThemeToggle`. */
export const Sliding: Story = {
  render: function SlidingTrack() {
    const [isDark, setIsDark] = useState(true);
    return (
      <button
        type="button"
        onClick={() => setIsDark((dark) => !dark)}
        className="cursor-pointer p-3"
      >
        <ThemeSwitchTrack isDark={isDark} />
      </button>
    );
  },
};
