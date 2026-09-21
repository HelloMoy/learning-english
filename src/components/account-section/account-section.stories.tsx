import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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

/** An account created with an email and a password: both forms are offered. */
export const WithPassword: Story = {};

/**
 * An account that only ever signed in with Google: the address belongs to the
 * provider and there is no password to authorize a change with, so the section
 * explains and offers nothing.
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

/** A password account that later linked Google: both methods, both forms. */
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
