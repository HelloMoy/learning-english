import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WatchProgressBar } from "./watch-progress-bar";

/**
 * The bar is presentational: both labels arrive already localized, so the
 * stories pass literals rather than reaching for the `Stories.*` namespace.
 * Every state a reviewer needs to compare is a value, not a locale.
 */
const meta: Meta<typeof WatchProgressBar> = {
  title: "Cinema/WatchProgressBar",
  component: WatchProgressBar,
  parameters: { backgrounds: { default: "dark" } },
  args: { value: 40, max: 100, label: "40%", ariaLabel: "40% watched" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WatchProgressBar>;

export const PartlyWatched: Story = {};

export const BarelyStarted: Story = {
  args: { value: 3, max: 100, label: "3%", ariaLabel: "3% watched" },
};

export const Finished: Story = {
  args: { value: 100, max: 100, label: "100%", ariaLabel: "100% watched" },
};

/** The module meter's shape: a count rather than a percentage. */
export const CountingLessons: Story = {
  args: { value: 7, max: 17, label: "7 / 17 videos", ariaLabel: "7 of 17 videos completed" },
};

export const Empty: Story = {
  args: { value: 0, max: 100, label: "0%", ariaLabel: "0% watched" },
};
