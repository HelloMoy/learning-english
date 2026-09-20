import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { GlobalErrorFallback } from "./global-error-fallback";

/**
 * The page a learner sees when the root layout fails. It reads its locale
 * from the URL, so in Storybook it renders in the default locale.
 */
const meta = {
  title: "Components/GlobalErrorFallback",
  component: GlobalErrorFallback,
  args: { error: new Error("The root layout failed"), retry: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GlobalErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The fallback with its one retry button. */
export const Default: Story = {};
