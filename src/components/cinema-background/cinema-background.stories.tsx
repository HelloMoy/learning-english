import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CinemaBackground } from "./cinema-background";

/**
 * Stories for `<CinemaBackground />`, the Immersion Cinema backdrop.
 *
 * The component is `position: fixed` and `-z-10`, so it fills the whole
 * preview iframe rather than sitting inside a box. Sample content is layered
 * on top so the warm glow and the letterbox scrim can be judged against real
 * text contrast instead of on an empty canvas.
 *
 * Switch the Storybook theme toolbar between light and dark — the gradient is
 * built from `--glow`, `--background` and `--letterbox`, so it should recolour
 * with the theme rather than staying fixed.
 */
const meta = {
  title: "Cinema/CinemaBackground",
  component: CinemaBackground,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="min-h-96 p-10">
        <Story />
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-[0.4em] text-gold uppercase">
            Immersion Cinema
          </span>
          <h1 className="font-sans text-5xl font-extrabold tracking-tight text-foreground">
            Contrast check
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Body copy sits above the backdrop. The glow must never wash out this text in either
            theme.
          </p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof CinemaBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The backdrop with representative content layered over it. */
export const Default: Story = {};
