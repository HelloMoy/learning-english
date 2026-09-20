import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DeleteAccountSection } from "./delete-account-section";

const meta = {
  title: "Components/DeleteAccountSection",
  component: DeleteAccountSection,
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <div className="max-w-xl p-6">
          <Story />
        </div>
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<typeof DeleteAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The section at the end of the Profile page, before anything is asked. */
export const Default: Story = {};

/** In Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
