import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { withConsent } from "../../../.storybook/fixtures/product-analytics";
import { SiteFooter } from "./site-footer";

/**
 * Stories for `<SiteFooter />`, the bar carrying the privacy policy and the
 * terms.
 *
 * Use the locale toolbar to check both labels in `en`, `es` and `pt`, and the
 * theme toolbar to check the top border against each background — it is the
 * only thing separating the footer from the content above it.
 */
const meta = {
  title: "Components/SiteFooter",
  component: SiteFooter,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-60 flex-col">
        <div className="flex-1 px-4 py-6 text-sm text-muted-foreground sm:px-11">
          Page content. The footer sits below it, pushed to the bottom by the layout&rsquo;s column.
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As every page renders it when no usage data is collected: the two documents alone. */
export const Default: Story = {};

/**
 * With usage data collected, the footer also offers to reopen the privacy
 * choice. Check that the control reads as one of the links beside it.
 */
export const WithPrivacyChoices: Story = {
  beforeEach: withConsent("granted"),
};

/** Locked to Spanish, for checking the label lengths side by side. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  beforeEach: withConsent("granted"),
};

/** Locked to Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  beforeEach: withConsent("granted"),
};
