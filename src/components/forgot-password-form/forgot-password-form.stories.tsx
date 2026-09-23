import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ForgotPasswordForm } from "./forgot-password-form";

/**
 * The forgot-password form: one email field behind the Turnstile widget. Storybook serves no `/api/auth`,
 * so submitting shows the generic error — the stories are for layout and copy.
 */
const meta = {
  title: "Components/ForgotPasswordForm",
  component: ForgotPasswordForm,
  args: {},
  decorators: [
    (Story) => (
      <div className="w-[26rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ForgotPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** English. */
export const Default: Story = {};

/** Spanish copy. */
export const InSpanish: Story = { parameters: { locale: "es" } };
