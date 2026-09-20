import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignInForm } from "./sign-in-form";

/**
 * The sign-in form with the real Turnstile widget (test key: it passes by
 * itself). Storybook serves no `/api/auth`, so submitting shows the generic
 * error — the stories are for layout, copy and validation.
 */
const meta = {
  title: "Components/SignInForm",
  component: SignInForm,
  args: { returnPath: "/learning" },
  decorators: [
    (Story) => (
      <div className="w-[26rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Google, then email and password. */
export const Default: Story = {};

/** Arriving from a password reset. */
export const AfterPasswordReset: Story = { args: { passwordUpdated: true } };

/** Spanish copy. */
export const InSpanish: Story = { parameters: { locale: "es" } };

/** Phone width. */
export const OnAPhone: Story = { globals: { viewport: { value: "mobile2" } } };
