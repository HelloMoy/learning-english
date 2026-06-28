/**
 * Storybook stories for the `<LocaleSwitcher />` component.
 *
 * Uses the global `withNextIntl` decorator (see `.storybook/preview.tsx`),
 * which respects `parameters.locale` as an explicit per-story override over
 * the toolbar selection. Each story below sets that parameter to lock the
 * switcher into the matching locale.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LocaleSwitcher } from "./locale-switcher";

/**
 * Default story configuration for the `LocaleSwitcher`.
 *
 * The selected locale is driven by `parameters.locale` — set per story below.
 */
const meta = {
  title: "Components/LocaleSwitcher",
  component: LocaleSwitcher,
  parameters: {
    layout: "centered",
    locale: "en",
  },
} satisfies Meta<typeof LocaleSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dropdown showing `English` selected (the `en` option). */
export const English: Story = {
  parameters: { locale: "en" },
};

/** Dropdown showing `Español` selected (the `es` option). */
export const Spanish: Story = {
  parameters: { locale: "es" },
};

/** Dropdown showing `Português` selected (the `pt` option). */
export const Portuguese: Story = {
  parameters: { locale: "pt" },
};
