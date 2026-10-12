import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { withConsent } from "../../../.storybook/fixtures/product-analytics";
import { ConsentBanner } from "./consent-banner";

/**
 * Stories for `<ConsentBanner />`, the question asked before any usage data is
 * stored or sent.
 *
 * Use the locale toolbar to check the copy in `en`, `es` and `pt` — Spanish
 * and Portuguese run longer — and the theme toolbar to check the card against
 * each background. Answering dismisses the banner; reload the story to see it
 * again.
 */
const meta = {
  title: "Components/ConsentBanner",
  component: ConsentBanner,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-[32rem] px-4 py-6 text-sm text-muted-foreground sm:px-11">
        Page content. The banner sits over its bottom corner without blocking it.
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConsentBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A first visit: nothing has been answered, so the question is open. */
export const Asking: Story = {
  beforeEach: withConsent("pending"),
};

/** Locked to Spanish, the longest of the three bodies. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  beforeEach: withConsent("pending"),
};

/** Locked to Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  beforeEach: withConsent("pending"),
};

/** After an answer, or with no usage data collected, the banner renders nothing. */
export const Answered: Story = {
  beforeEach: withConsent("denied"),
};
