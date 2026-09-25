import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { AccountChallenge } from "./account-challenge";

/**
 * The real Cloudflare widget, as the account forms place it. On Storybook's dev
 * server it's always visible; a static Storybook build hides it unless
 * Cloudflare needs a click.
 */
const meta = {
  title: "Components/AccountChallenge",
  component: AccountChallenge,
  args: { submission: { challengeKey: 0, onToken: fn() } },
  decorators: [
    (Story) => (
      <div className="flex w-80 flex-col gap-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountChallenge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The challenge at the end of a form. */
export const Default: Story = {};

/** The widget speaks the page's language. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
