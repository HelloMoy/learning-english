import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { PrizeShelfItem } from "./prize-shelf-item";

const meta = {
  title: "Components/PrizeShelfItem",
  component: PrizeShelfItem,
  args: {
    prize: "harmonica",
    moduleTitle: "Vowels",
    moduleSlug: "2-vowels",
    state: "collecting",
    ticketsEarned: 12,
    ticketCount: 17,
    onClaim: fn(),
  },
  decorators: [
    (Story) => (
      <ul className="flex w-48 justify-center pt-4">
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof PrizeShelfItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Twelve of seventeen tickets: a silhouette with a swaying tag. */
export const Collecting: Story = {};

/** Every ticket collected: still a silhouette, now offering the claim. */
export const ReadyToClaim: Story = {
  args: { state: "ready", ticketsEarned: 17 },
};

/** Claimed: the harmonica, named and glowing. */
export const Claimed: Story = {
  args: { state: "claimed", ticketsEarned: 17 },
};

/** No ticket yet. */
export const Locked: Story = {
  args: {
    prize: "megaphone",
    moduleTitle: "Consonants",
    moduleSlug: "3-consonants",
    state: "locked",
    ticketsEarned: 0,
    ticketCount: 25,
  },
};

/** Spanish claim control and hidden-state sentence. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  args: { state: "ready", ticketsEarned: 17 },
};

/** Portuguese claim control and hidden-state sentence. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  args: { state: "ready", ticketsEarned: 17 },
};
