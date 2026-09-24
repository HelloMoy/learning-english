import NiceModal from "@ebay/nice-modal-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { InstallAppButton } from "./install-app-button";

/**
 * The header chip that gets the course onto the learner's home screen.
 *
 * The control itself is presentational, so it renders here on any browser.
 * Whether it exists at all is `SiteHeader`'s decision — some install path, and
 * the app not already installed — which is why that condition is tested there
 * and not visible in these stories.
 *
 * It has two destinations, and the `path` arg picks between them. The glyph is
 * the same either way; the difference is the accessible name, which says
 * whether the chip is about to teach the flow or perform it. Inspect the
 * control to read it, or click: `guide` opens the five-step guide, `prompt`
 * opens the confirmation. The `NiceModal.Provider` below is what makes that
 * work, because the app mounts its own in `global-providers` and the Storybook
 * preview has none.
 *
 * It is shown next to the theme chip so the two can be compared at a glance;
 * that is where it sits in the real header.
 */
const meta = {
  title: "Components/InstallAppButton",
  component: InstallAppButton,
  parameters: { layout: "centered" },
  args: { path: { kind: "guide" } },
  argTypes: {
    path: {
      control: { type: "inline-radio" },
      options: ["guide", "prompt"],
      mapping: {
        guide: { kind: "guide" },
        prompt: { kind: "prompt", accept: () => {} },
      },
    },
  },
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

/** On iPhone Safari, where the flow can only be taught. */
export const OpensTheGuide: Story = {};

/** On Android or a desktop, where the browser offered to do the install. */
export const OpensThePrompt: Story = {
  args: { path: { kind: "prompt", accept: () => {} } },
};

/** The same control in Spanish — the difference is its accessible name. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** And in Portuguese. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
