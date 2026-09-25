import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { TurnstileChallenge } from "./turnstile-challenge";

/**
 * The real Cloudflare widget. With the always-pass test site key from
 * `.env.example` it passes by itself a moment after it loads.
 *
 * Storybook's dev server shows the box. A static Storybook build is a
 * production build, where the widget hides unless Cloudflare needs a click.
 */
const meta = {
  title: "Components/TurnstileChallenge",
  component: TurnstileChallenge,
  args: { onToken: fn() },
} satisfies Meta<typeof TurnstileChallenge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The widget in English. */
export const Default: Story = {};

/** The widget speaks the page's language. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
