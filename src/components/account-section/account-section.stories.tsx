import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { AccountSection } from "./account-section";

const meta = {
  title: "Components/AccountSection",
  component: AccountSection,
  args: {
    account: {
      name: "Ana García",
      email: "ana@example.com",
      signInMethods: ["password"],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An account created with an email and a password: the address and password rows, both closed. */
export const WithPassword: Story = {};

/** The password row opened: the change-password form shows under it. */
export const PasswordRowOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Change Password" }));
    await expect(canvas.getByLabelText("Current password")).toBeVisible();
  },
};

/**
 * An account that only ever signed in with Google: the address belongs to the
 * provider and there is no password to authorize a change with, so the address
 * is a plain row and the section explains why.
 */
export const GoogleOnly: Story = {
  args: {
    account: {
      name: "Ana García",
      email: "ana@gmail.com",
      signInMethods: ["google"],
    },
  },
};

/** A password account that later linked Google: both methods, both rows. */
export const BothMethods: Story = {
  args: {
    account: {
      name: "Ana García",
      email: "ana@example.com",
      signInMethods: ["password", "google"],
    },
  },
};

/** In Spanish. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** In Portuguese, for a Google account. */
export const GoogleOnlyInPortuguese: Story = {
  args: GoogleOnly.args,
  parameters: { locale: "pt" },
};
