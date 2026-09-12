import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { UnmarkLessonModal } from "./unmark-lesson-modal";

/**
 * The confirmation that guards un-marking a completed lesson. It is shown
 * imperatively, so the story opens it on mount inside the modal provider.
 */
function OpenedUnmarkLessonModal() {
  useEffect(() => {
    void NiceModal.show(UnmarkLessonModal);
  }, []);
  return (
    <NiceModal.Provider>
      <div className="min-h-64" />
    </NiceModal.Provider>
  );
}

const meta = {
  title: "Components/UnmarkLessonModal",
  component: OpenedUnmarkLessonModal,
} satisfies Meta<typeof OpenedUnmarkLessonModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The dialog as the learner meets it, with every consequence spelled out. */
export const Default: Story = {};

/** On a phone, where the copy has the least room. */
export const OnAPhone: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
