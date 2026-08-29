import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SkipLink } from "./skip-link";

/**
 * Stories for `<SkipLink />`, the first focusable element on every page.
 *
 * The link is `sr-only` until it takes keyboard focus, so a static preview
 * looks empty on purpose. **Press Tab inside the canvas** to reveal it —
 * that is the entire behaviour under review, and the only way to check the
 * focus ring and the translated label in each locale.
 */
const meta = {
  title: "Components/SkipLink",
  component: SkipLink,
  decorators: [
    (Story) => (
      <div className="relative min-h-40 rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground">
          Press Tab to reveal the skip link in the top-left corner.
        </p>
        <Story />
        <main
          id="main"
          className="mt-6 text-sm text-foreground"
        >
          Main landmark — the target this link jumps to.
        </main>
      </div>
    ),
  ],
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hidden until focused. Tab into the canvas to see it appear. */
export const Default: Story = {};
