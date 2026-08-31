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

/**
 * The phone variant. Below `sm` the trigger shows the locale's ISO code
 * instead of its full name — the control's whole reason for existing as a
 * button rather than a `<select>`, whose width would still be dictated by
 * "Portugués" no matter what was on screen.
 */
export const NarrowPhone: Story = {
  parameters: {
    locale: "es",
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};
