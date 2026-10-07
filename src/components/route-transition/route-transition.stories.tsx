import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RouteTransition } from "./route-transition";

/**
 * Stories for `<RouteTransition />`, the boundary the locale layout wraps
 * around every page and its footer.
 *
 * There is no motion to see here, on purpose: route transitions need a real
 * navigation and the React canary Next bundles, and Storybook has neither. What
 * this story does show is the other half of the component's job — the flex
 * column that keeps the footer at the bottom of a short page.
 *
 * To see the motion itself, run the app and follow a link, or open the
 * "Variante B — Espacial" artboard on the transitions design canvas.
 */
const meta = {
  title: "Components/RouteTransition",
  component: RouteTransition,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-80 flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RouteTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A short page: the content takes the free height and the footer stays below it. */
export const Default: Story = {
  args: {
    children: (
      <>
        <div className="flex-1 px-4 py-6 text-sm text-foreground sm:px-11">Page content</div>
        <div className="border-t border-border px-4 py-6 text-sm text-muted-foreground sm:px-11">
          Footer
        </div>
      </>
    ),
  },
};
