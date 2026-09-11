import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ScrollDownHint } from "./scroll-down-hint";

/**
 * The hint is absolutely positioned against the player box, so every story
 * stands one in: a dark 16:9 frame like the enlarged player on a phone held
 * in landscape. In the app the hint only exists while that player is pinned
 * to the viewport and the browser's toolbar is still on screen.
 *
 * Both animations run once per mount — the pill's entrance and the arrow's
 * bounded upward travel — so to watch them again, switch stories or toggle
 * any control. Storybook remounts on both.
 *
 * There is deliberately no reduced-motion story. `motion-reduce:` is a media
 * query, so nothing Storybook can set per story reaches it, and a story that
 * rendered identically to `Default` while claiming otherwise would be worse
 * than none. That guarantee is pinned by the component test and checked in the
 * browser's own emulation (DevTools → Rendering → Emulate
 * `prefers-reduced-motion`), where the hint should simply be there, arrow
 * pointing up, from the first frame.
 */
const meta = {
  title: "LessonView/ScrollDownHint",
  component: ScrollDownHint,
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
} satisfies Meta<typeof ScrollDownHint>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The hint as an English learner sees it: the pill lifts into place, the arrow
 * travels upward for six and a half seconds and then rests still pointing, and
 * the × closes it for the session.
 *
 * The arrow points where the *finger* goes, not where the page goes — on an
 * iPhone those are opposite — which is why the verb acts on the video rather
 * than on the page. Read arrow and words together: they have to ask for the
 * same thing.
 */
export const Default: Story = {};

/** The same copy from `Components.ScrollDownHint` in Spanish. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** And in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
