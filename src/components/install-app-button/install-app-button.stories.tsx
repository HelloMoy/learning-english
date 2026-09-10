import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { InstallAppButton } from "./install-app-button";

/**
 * The header chip that opens the install guide.
 *
 * The control itself is presentational, so it renders here on any browser.
 * Whether it exists at all is `SiteHeader`'s decision — iPhone Safari, not yet
 * installed — which is why that condition is tested there and not visible in
 * these stories.
 *
 * Click it: it opens the guide's modal. The `NiceModal.Provider` below is what
 * makes that work, because the app mounts its own in `global-providers` and the
 * Storybook preview has none.
 *
 * It is shown next to the theme chip so the two can be compared at a glance;
 * that is where it sits in the real header.
 */
const meta = {
  title: "Components/InstallAppButton",
  component: InstallAppButton,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <div className="flex items-center gap-2.5 bg-background p-6">
          <ThemeToggle />
          <Story />
        </div>
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<typeof InstallAppButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As an English learner on an iPhone sees it. */
export const Default: Story = {};

/** The same control in Spanish — the difference is its accessible name. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** And in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
