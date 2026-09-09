import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonVideoResumeOverlay } from "./lesson-video-resume-overlay";

/**
 * The overlay is absolutely positioned against its parent, so every story
 * needs a stand-in for the player box. The lesson-page content below it is
 * there to show what the overlay does *not* cover — the page stays live.
 */
const meta = {
  title: "LessonView/LessonVideoResumeOverlay",
  component: LessonVideoResumeOverlay,
  parameters: { layout: "fullscreen" },
  args: {
    positionSeconds: 180,
    // The overlay is presentational; in the app these seek and play the
    // video, and there is no video here to drive.
    onResume: () => {},
    onRestart: () => {},
  },
  argTypes: {
    positionSeconds: { control: { type: "number", min: 0 } },
  },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background p-10">
        <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-black">
          <Story />
        </div>
        <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
          Lesson content stays reachable while the overlay is open — it is not a modal.
        </p>
      </div>
    ),
  ],
} satisfies Meta<typeof LessonVideoResumeOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three minutes into a lesson — the common case. */
export const MidLecture: Story = {};

/** Under a minute in — checks the leading zero in the MM:SS timestamp. */
export const JustPastTheThreshold: Story = {
  args: { positionSeconds: 45 },
};

/** A long lesson — the minute count keeps running past an hour. */
export const LongLesson: Story = {
  args: { positionSeconds: 3661 },
};

/** The same offer in Spanish, to check the CTAs still fit side by side. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/**
 * The compact form, at the width where the player is a 16:9 box barely 200px
 * tall. The heading and the description stop being painted — they stay in the
 * accessibility tree — so the timestamp and the two actions fit without being
 * clipped by the player. The decorator narrows the player box rather than the
 * viewport, which is what the breakpoint actually responds to.
 */
export const OnAPhone: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background p-4">
        <div className="relative aspect-video w-full max-w-[358px] overflow-hidden rounded-2xl border border-border bg-black">
          <Story />
        </div>
        <p className="mt-6 max-w-[358px] text-sm text-muted-foreground">
          Nothing is cut off: the card is bounded by the player, and scrolls inside itself if a
          translation ever makes it taller.
        </p>
      </div>
    ),
  ],
  args: { positionSeconds: 550 },
};

/** The compact form in Spanish, where every label is longer. */
export const OnAPhoneInSpanish: Story = {
  ...OnAPhone,
  parameters: { locale: "es" },
};
