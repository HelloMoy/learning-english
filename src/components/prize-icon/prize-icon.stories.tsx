import { PRIZE_IDS } from "@/lib/module-prizes/module-prizes";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PrizeIcon } from "./prize-icon";

const meta = {
  title: "Components/PrizeIcon",
  component: PrizeIcon,
  args: { prize: "harmonica", locked: false, size: 160 },
  argTypes: {
    prize: { control: { type: "select" }, options: [...PRIZE_IDS] },
    size: { control: { type: "range", min: 24, max: 320, step: 4 } },
  },
} satisfies Meta<typeof PrizeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A redeemed prize in colour. */
export const Redeemed: Story = {};

/** The same prize before its tickets are collected. */
export const Silhouette: Story = {
  args: { locked: true },
};

/** Every prize in both states, to review the set side by side. */
export const AllPrizes: Story = {
  render: () => (
    <div className="grid grid-cols-8 gap-6">
      {PRIZE_IDS.map((prize) => (
        <div
          key={prize}
          className="flex flex-col items-center gap-2"
        >
          <PrizeIcon
            prize={prize}
            size={72}
          />
          <PrizeIcon
            prize={prize}
            locked
            size={40}
          />
          <span className="text-xs text-muted-foreground">{prize}</span>
        </div>
      ))}
    </div>
  ),
};
