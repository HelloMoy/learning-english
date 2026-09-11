import { SEEK_STEP_SECONDS } from "@/lib/seek-run/seek-run";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SeekFeedback } from "./seek-feedback";

/**
 * The indicator is absolutely positioned against the player box, so every
 * story stands one in: a dark 16:9 frame like the player in the lesson page.
 * In the app it exists only while a seek run is active — from a double tap
 * on an edge until the taps stop — and the count grows with every tap.
 *
 * The chevrons pulse in sequence for as long as the story is mounted, and
 * the half-disc's entrance runs once per mount; switch stories or toggle a
 * control to watch it again.
 *
 * There is deliberately no reduced-motion story: `motion-reduce:` is a media
 * query that nothing set per story reaches. The still indicator is pinned by
 * the component test and checked in the browser's own emulation (DevTools →
 * Rendering → Emulate `prefers-reduced-motion`).
 */
const meta = {
  title: "LessonView/SeekFeedback",
  component: SeekFeedback,
  parameters: { layout: "fullscreen" },
  argTypes: {
    direction: { control: { type: "radio" }, options: ["forward", "backward"] },
    seconds: { control: { type: "number", min: SEEK_STEP_SECONDS, step: SEEK_STEP_SECONDS } },
  },
  args: { direction: "forward", seconds: SEEK_STEP_SECONDS },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-black p-6">
        <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-neutral-900">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SeekFeedback>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One double tap on the right edge: a single step forward. */
export const Forward: Story = {};

/** One double tap on the left edge: a single step back, chevrons pointing left. */
export const Backward: Story = {
  args: { direction: "backward" },
};

/** Three taps in a row on the same edge — the label counts the whole run. */
export const Accumulated: Story = {
  args: { seconds: 3 * SEEK_STEP_SECONDS },
};

/** The count and the spoken sentence in Spanish, through `Components.SeekFeedback`. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  args: { seconds: 2 * SEEK_STEP_SECONDS },
};

/** The same in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  args: { direction: "backward", seconds: 2 * SEEK_STEP_SECONDS },
};
