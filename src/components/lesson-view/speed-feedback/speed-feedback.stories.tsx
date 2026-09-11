import { HOLD_PLAYBACK_RATE } from "@/hooks/use-speed-hold/use-speed-hold";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SpeedFeedback } from "./speed-feedback";

/**
 * The pill is absolutely positioned against the player box, so every story
 * stands one in: a dark 16:9 frame like the player in the lesson page. In the
 * app it exists only while a press is held on the video — from half a second
 * after the finger lands until it lifts — and it names the rate the hold is
 * applying.
 *
 * The entrance runs once per mount; switch stories or change the control to
 * watch it again.
 *
 * There is deliberately no reduced-motion story: `motion-reduce:` is a media
 * query that nothing set per story reaches. The still pill is pinned by the
 * component test and checked in the browser's own emulation (DevTools →
 * Rendering → Emulate `prefers-reduced-motion`).
 */
const meta = {
  title: "LessonView/SpeedFeedback",
  component: SpeedFeedback,
  parameters: { layout: "fullscreen" },
  argTypes: {
    rate: { control: { type: "number", min: 1, step: 0.5 } },
  },
  args: { rate: HOLD_PLAYBACK_RATE },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-black p-6">
        <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-neutral-900">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SpeedFeedback>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A press held on the video: the rate the gesture applies. */
export const Default: Story = {};

/**
 * A learner who had already chosen a faster rate from the player's speed menu
 * sees the hold's own rate, not a multiple of theirs.
 */
export const FromAFasterRate: Story = {
  args: { rate: 1.5 },
};

/** The pill and the spoken sentence in Spanish, through `Components.SpeedFeedback`. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** The same in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
