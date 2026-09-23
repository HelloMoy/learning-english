import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ResetPasswordForm } from "./reset-password-form";

/**
 * The reset-password form: the new password, no challenge. Storybook serves
 * no `/api/auth`, so submitting shows the generic error — the stories are for
 * layout and copy.
 */
const meta = {
  title: "Components/ResetPasswordForm",
  component: ResetPasswordForm,
  args: { token: "preview-token" },
  decorators: [
    (Story) => (
      <div className="w-[26rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** English. */
export const Default: Story = {};

/** Spanish copy. */
export const InSpanish: Story = { parameters: { locale: "es" } };

/** A spent or expired link: the way to request a new one. */
export const InvalidLink: Story = { args: { token: undefined } };
