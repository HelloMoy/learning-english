import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GuidePlaybackRail } from "./guide-playback-rail";

/**
 * The row every install guide is moved by. It replaces the decorative dots the
 * guides used to draw, so a learner can see that the guide can be moved at all
 * — which a horizontal drag never told them, and could not tell them on a Mac.
 *
 * The frame on screen counts down over one step interval. Watch it fill.
 */
const meta = {
  title: "Components/GuidePlaybackRail",
  component: GuidePlaybackRail,
  parameters: { layout: "centered" },
  args: {
    frameCount: 5,
    stepCount: 4,
    frameIndex: 0,
    isPlaying: true,
    onShowPrevious: () => {},
    onShowNext: () => {},
    onShowFrame: () => {},
  },
  argTypes: {
    frameIndex: { control: { type: "range", min: 0, max: 4, step: 1 } },
  },
  decorators: [
    (Story) => (
      <div className="rounded-2xl border border-border bg-card p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuidePlaybackRail>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first tap of the iPad's four. */
export const FirstFrame: Story = {};

/** Partway through. */
export const MiddleFrame: Story = { args: { frameIndex: 2 } };

/** The result, whose control is named for what it is rather than as a fifth step. */
export const ResultFrame: Story = { args: { frameIndex: 4 } };

/** The Mac's shorter flow: three taps and the result. */
export const ShorterFlow: Story = { args: { frameCount: 4, stepCount: 3, frameIndex: 1 } };

/**
 * Under a reduced-motion preference the guide does not advance on its own, so
 * no countdown is drawn — a bar that never empties would describe nothing.
 */
export const NotPlaying: Story = { args: { isPlaying: false, frameIndex: 2 } };

/** The Spanish names, which are the longest of the three. */
export const InSpanish: Story = { args: { frameIndex: 1 }, parameters: { locale: "es" } };
