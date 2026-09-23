import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GoogleSignInButton } from "./google-sign-in-button";

/**
 * Pressing it in Storybook starts a real request to `/api/auth`, which the
 * static Storybook server does not serve — the story is for the look only.
 */
const meta = {
  title: "Components/GoogleSignInButton",
  component: GoogleSignInButton,
  args: { returnPath: "/learning" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoogleSignInButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** English. */
export const Default: Story = {};

/** Spanish. */
export const InSpanish: Story = { parameters: { locale: "es" } };

/** Portuguese. */
export const InPortuguese: Story = { parameters: { locale: "pt" } };
