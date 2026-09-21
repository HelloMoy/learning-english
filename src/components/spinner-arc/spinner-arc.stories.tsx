import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SpinnerArc } from "./spinner-arc";

const meta = {
  title: "Components/SpinnerArc",
  component: SpinnerArc,
} satisfies Meta<typeof SpinnerArc>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The arc at the size it turns at inside a button, on the page's own ink. */
export const Default: Story = {
  render: (args) => (
    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
      <SpinnerArc {...args} />
      Signing in…
    </span>
  ),
};

/** On a filled gold button, where it takes the button's ink rather than the page's. */
export const OnAFilledButton: Story = {
  render: (args) => (
    <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">
      <SpinnerArc {...args} />
      Signing in…
    </span>
  ),
};

/** Larger, for a surface that is not a button. */
export const Large: Story = {
  args: { className: "size-6 border-[3px]" },
};
