import type { PrizeId } from "@/lib/module-prizes/module-prizes";

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { PrizeReadyModal } from "./prize-ready-modal";

/** A trigger standing in for the lesson page collecting a module's last ticket. */
function ReadyTrigger({
  prize,
  moduleTitle,
  ticketCount,
}: {
  prize: PrizeId;
  moduleTitle: string;
  ticketCount: number;
}) {
  return (
    <button
      type="button"
      onClick={() => void NiceModal.show(PrizeReadyModal, { prize, moduleTitle, ticketCount })}
      className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground"
    >
      Collect the last ticket
    </button>
  );
}

const meta = {
  title: "Components/PrizeReadyModal",
  component: ReadyTrigger,
  args: { prize: "harmonica", moduleTitle: "Vowels", ticketCount: 17 },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <Story />
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<typeof ReadyTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Seventeen Vowels tickets: the harmonica waits at the counter, still a silhouette. */
export const PrizeWaiting: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(await within(document.body).findByRole("dialog")).toBeInTheDocument();
  },
};

/** A one-lesson module: a single ticket readies the whistle. */
export const SingleTicket: Story = {
  args: { prize: "whistle", moduleTitle: "Introduction", ticketCount: 1 },
  play: PrizeWaiting.play,
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  play: PrizeWaiting.play,
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  play: PrizeWaiting.play,
};
