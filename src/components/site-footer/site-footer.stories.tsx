import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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

/** As every page renders it. */
export const Default: Story = {};

/** Locked to Spanish, for checking the label lengths side by side. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Locked to Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
