import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SwipeUpHint } from "./swipe-up-hint";

/**
 * The hint is absolutely positioned against the player box, so every story
 * stands one in: a dark 16:9 frame like the enlarged player on a phone held
 * in landscape. In the app the hint only exists while that player is pinned
 * to the viewport and the browser's toolbar is still on screen.
 */
const meta = {
  title: "LessonView/SwipeUpHint",
  component: SwipeUpHint,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-black p-6">
        <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-neutral-900">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SwipeUpHint>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The hint as an English learner sees it; the × closes it for the session. */
export const Default: Story = {};

/** The same copy from `Components.SwipeUpHint` in Spanish. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** And in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
