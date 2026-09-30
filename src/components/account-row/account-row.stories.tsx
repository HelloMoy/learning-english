import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { AccountRow } from "./account-row";

const meta = {
  title: "Components/AccountRow",
  component: AccountRow,
  args: {
    label: "Password",
    value: "••••••••",
    children: (
      <label className="flex max-w-sm flex-col gap-2 text-sm font-semibold">
        New password
        <input
          type="password"
          className="min-h-11 rounded-lg border border-border bg-card px-3"
        />
      </label>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed, as the Profile page first shows it. */
export const Closed: Story = {};

/** Opened with Change: the form shows under the row and the button offers Close. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Change Password" }));
    await expect(canvas.getByRole("button", { name: "Close Password" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

/** Nothing to change: a Google-managed address is a plain row. */
export const PlainRow: Story = {
  args: { label: "Email address", value: "ana@gmail.com", children: undefined },
};

/** In Spanish the button reads Cambiar. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  args: { label: "Contraseña" },
};
