import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { AchievementsGuideModal } from "./achievements-guide-modal";

/** A trigger standing in for the Achievements page's How do they work? button. */
function GuideTrigger() {
  return (
    <button
      type="button"
      onClick={() => void NiceModal.show(AchievementsGuideModal)}
      className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground"
    >
      Open the explanation
    </button>
  );
}

const meta = {
  title: "Components/AchievementsGuideModal",
  component: GuideTrigger,
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <Story />
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<typeof GuideTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opened: the three levels and the un-marking note. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(await within(document.body).findByRole("dialog")).toBeInTheDocument();
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  play: Open.play,
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  play: Open.play,
};
