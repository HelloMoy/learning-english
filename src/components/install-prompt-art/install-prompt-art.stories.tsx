import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { InstallPromptArt } from "./install-prompt-art";

/**
 * The picture the install prompt shows before it asks: where the course will
 * come to rest. The Safari guides all end on the same frame, because a guide
 * that stops at the confirmation asks for effort and never shows the payoff.
 *
 * It is drawn, not photographed, so it carries no operating system the learner
 * may not have.
 */
const meta = {
  title: "Components/InstallPromptArt",
  component: InstallPromptArt,
  parameters: { layout: "centered" },
  args: { surface: "handheld" },
  argTypes: {
    surface: { control: { type: "inline-radio" }, options: ["handheld", "desktop"] },
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] rounded-2xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InstallPromptArt>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On a handheld: the icon on the home screen, among the learner's other apps. */
export const OnAHandheld: Story = {};

/**
 * On a desktop: the course in the application switcher. It argues from presence
 * rather than from the tabs it loses — and a browser tab never appears here.
 */
export const OnADesktop: Story = { args: { surface: "desktop" } };
