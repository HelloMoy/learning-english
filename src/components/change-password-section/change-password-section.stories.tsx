import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ChangePasswordSection } from "./change-password-section";

const meta = {
  title: "Components/ChangePasswordSection",
  component: ChangePasswordSection,
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChangePasswordSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The form as the Profile page shows it, before anything is typed. */
export const Default: Story = {};

/** In Spanish, where the labels are longest. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** In Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

/**
 * A new password shorter than the rule allows never reaches the server: the
 * field says so and the request is not made.
 */
export const RefusedBeforeSending: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Current password"), "current-password");
    await userEvent.type(canvas.getByLabelText("New password"), "1234567");
    await userEvent.click(canvas.getByRole("button", { name: "Change password" }));

    await expect(canvas.getByRole("alert")).toHaveTextContent("Use between 8 and 128 characters.");
  },
};
