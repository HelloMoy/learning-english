/**
 * Storybook stories for the `<ThemeToggle />` component.
 *
 * The story wraps itself in a `ThemeProvider` because `next-themes`'s
 * `useTheme()` hook needs the provider context to read/write the persisted
 * theme from `localStorage`. Wrapping locally (rather than via the global
 * preview decorator) keeps the dependency scoped to stories that actually
 * use it.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";

import { ThemeToggle } from "./theme-toggle";

/**
 * Default story configuration for the `ThemeToggle`.
 *
 * Cycles through `light` → `dark` → `system` on each click. Use the
 * Storybook locale toolbar to see the labels translated.
 */
const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state — renders the "Light" label until clicked. */
export const Default: Story = {};

/** Demonstrates the toggle mounted in dark mode (the inner provider sets the default to `dark`). */
export const InDarkMode: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <Story />
      </ThemeProvider>
    ),
  ],
};

/** Demonstrates the toggle mounted in system mode (follows the OS preference). */
export const InSystemMode: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Story />
      </ThemeProvider>
    ),
  ],
};
