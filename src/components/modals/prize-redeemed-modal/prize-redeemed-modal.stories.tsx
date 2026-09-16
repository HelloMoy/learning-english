import type { PrizeId } from "@/lib/module-prizes/module-prizes";

import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { PrizeRedeemedModal } from "./prize-redeemed-modal";

/** Where the counter says the learner left off. */
const CONTINUE_HREF = "/courses/basic-course/modules/2-vowels/lessons/schwa";

/** A trigger standing in for the lesson page completing a module's last lesson. */
function RedeemTrigger({
  prize,
  moduleTitle,
  ticketCount,
  continueHref,
}: {
  prize: PrizeId;
  moduleTitle: string;
  ticketCount: number;
  continueHref?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        void NiceModal.show(PrizeRedeemedModal, {
          prize,
          moduleTitle,
          ticketCount,
          continueHref,
        })
      }
      className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground"
    >
      Redeem
    </button>
  );
}

const meta = {
  title: "Components/PrizeRedeemedModal",
  component: RedeemTrigger,
  args: {
    prize: "harmonica",
    moduleTitle: "Vowels",
    ticketCount: 17,
    continueHref: CONTINUE_HREF,
  },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <Story />
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<typeof RedeemTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Seventeen Vowels tickets redeem the harmonica. */
export const Redeemed: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(await within(document.body).findByRole("dialog")).toBeInTheDocument();
  },
};

/** A one-lesson module: a single ticket redeems the whistle. */
export const SingleTicket: Story = {
  args: { prize: "whistle", moduleTitle: "Introduction", ticketCount: 1 },
  play: Redeemed.play,
};

/**
 * Nothing to continue — an empty catalog, or a record resolving to nothing —
 * so closing is the only way out, as it was before this offer existed.
 */
export const NowhereToContinue: Story = {
  args: { continueHref: null },
  play: Redeemed.play,
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  play: Redeemed.play,
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  play: Redeemed.play,
};
