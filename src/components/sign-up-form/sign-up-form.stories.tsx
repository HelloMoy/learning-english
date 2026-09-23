import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignUpForm } from "./sign-up-form";

/**
 * The sign-up form with the real Turnstile widget (test key: it passes by
 * itself). Storybook serves no `/api/auth`, so submitting shows the generic
 * error — the stories are for layout, copy and validation.
 */
const meta = {
  title: "Components/SignUpForm",
  component: SignUpForm,
  args: { returnPath: "/learning" },
  decorators: [
    (Story) => (
      <div className="w-[26rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Google first, then name, email and password. */
export const Default: Story = {};

/** Spanish copy. */
export const InSpanish: Story = { parameters: { locale: "es" } };

/** Phone width. */
export const OnAPhone: Story = { globals: { viewport: { value: "mobile2" } } };
