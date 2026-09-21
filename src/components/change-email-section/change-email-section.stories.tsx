import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ChangeEmailSection } from "./change-email-section";

const meta = {
  title: "Components/ChangeEmailSection",
  component: ChangeEmailSection,
  args: { currentEmail: "ana@example.com" },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChangeEmailSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The form as the Profile page shows it: it names where the first link goes. */
export const Default: Story = {};

/** In Spanish. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** In Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

/** The address the account already holds is refused before anything is sent. */
export const RefusedBeforeSending: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("New email address"), "ana@example.com");
    await userEvent.click(canvas.getByRole("button", { name: "Change email" }));

    await expect(canvas.getByRole("alert")).toHaveTextContent("That is already your address.");
  },
};
