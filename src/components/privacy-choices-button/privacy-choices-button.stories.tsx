import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { withConsent } from "../../../.storybook/fixtures/product-analytics";
import { PrivacyChoicesButton } from "./privacy-choices-button";

/**
 * Stories for `<PrivacyChoicesButton />`, the footer control that reopens the
 * consent question.
 *
 * On its own it is unstyled text; `SiteFooter` passes the classes that make
 * it match the links beside it — see `Components/SiteFooter`.
 */
const meta = {
  title: "Components/PrivacyChoicesButton",
  component: PrivacyChoicesButton,
  args: { className: "text-sm text-muted-foreground underline-offset-4 hover:underline" },
} satisfies Meta<typeof PrivacyChoicesButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Offered whenever usage data is collected, whatever the visitor answered. */
export const Default: Story = {
  beforeEach: withConsent("granted"),
};

/** Locked to Spanish. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  beforeEach: withConsent("granted"),
};

/** Locked to Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
  beforeEach: withConsent("granted"),
};

/** With no usage data collected there is no choice to reopen, so nothing renders. */
export const Unavailable: Story = {};
