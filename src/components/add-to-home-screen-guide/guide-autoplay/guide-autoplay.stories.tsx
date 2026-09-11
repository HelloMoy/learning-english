import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GuideAutoplay } from "./guide-autoplay";

/**
 * The install guide: the five steps play on a loop.
 *
 * This is the prototype video's pacing, rebuilt from components so its iOS
 * labels can be translated. Use the toolbar locale switcher to check that the
 * iOS control names follow it — a learner whose phone is in Spanish must be
 * told to look for «Compartir», not "Share".
 *
 * It also answers a horizontal drag: press on the panel, move at least
 * `SWIPE_THRESHOLD_PX` sideways and release — leftwards for the next frame,
 * rightwards for the previous one, both ends wrapping. A drag that travels
 * further vertically than sideways is left to the page, so try that too.
 *
 * Under an operating system set to reduced motion it deliberately holds its
 * first step, so this story will look static on such a machine — the drag is
 * the only way to move it there, and it still works.
 */
const meta = {
  title: "Components/AddToHomeScreenGuide/GuideAutoplay",
  component: GuideAutoplay,
  parameters: { layout: "fullscreen" },
  args: { onDismiss: () => {} },
  decorators: [
    (Story) => (
      <div className="flex min-h-svh items-start justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof GuideAutoplay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The loop as an English learner sees it. */
export const Default: Story = {};

/** The same loop in Spanish, iOS labels included. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** And in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

/**
 * The same guide, with the drag as the thing to try: move the frame by hand,
 * reverse it, and watch the loop pick up again a full interval later rather
 * than snatching the frame away mid-read.
 *
 * A mouse drag across the panel works exactly as a finger does — the gesture is
 * built on pointer events, which is what makes it drivable here at all.
 */
export const MovedByHand: Story = {};
