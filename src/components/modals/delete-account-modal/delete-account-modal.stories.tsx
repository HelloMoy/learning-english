import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { DeleteAccountModal } from "./delete-account-modal";

/**
 * The confirmation that guards deleting an account. It is shown
 * imperatively, so the story opens it on mount inside the modal provider.
 */
function OpenedDeleteAccountModal() {
  useEffect(() => {
    void NiceModal.show(DeleteAccountModal);
  }, []);
  return (
    <NiceModal.Provider>
      <div className="min-h-64" />
    </NiceModal.Provider>
  );
}

const meta = {
  title: "Components/DeleteAccountModal",
  component: OpenedDeleteAccountModal,
} satisfies Meta<typeof OpenedDeleteAccountModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The dialog as the learner meets it, with Cancel focused. */
export const Default: Story = {};

/** In Spanish, whose button copy runs longest. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** On a phone, where the copy has the least room. */
export const OnAPhone: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
