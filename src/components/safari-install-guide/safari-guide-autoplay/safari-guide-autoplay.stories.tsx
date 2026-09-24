import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SafariGuideAutoplay } from "./safari-guide-autoplay";

/**
 * The install guide for the two Safaris that need one: an iPad, whose share
 * popover opens collapsed, and a Mac, whose does not.
 *
 * It plays itself. Drag across it horizontally to move a frame either way —
 * both ends wrap, and the loop keeps running afterwards.
 */
const meta = {
  title: "Components/SafariGuideAutoplay",
  component: SafariGuideAutoplay,
  parameters: { layout: "centered" },
  args: { platform: "ipad", onDismiss: () => {} },
  argTypes: {
    platform: { control: { type: "inline-radio" }, options: ["ipad", "mac"] },
  },
} satisfies Meta<typeof SafariGuideAutoplay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four taps, ending on the home screen. */
export const OnAnIpad: Story = {};

/** Three clicks, ending in the Dock — a Mac has no home screen. */
export const OnAMac: Story = { args: { platform: "mac" } };

/** The Spanish copy, which is the longest of the three. */
export const InSpanish: Story = { parameters: { locale: "es" } };

/** And in Portuguese. */
export const InPortuguese: Story = { args: { platform: "mac" }, parameters: { locale: "pt" } };
