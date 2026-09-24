import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  SAFARI_INSTALL_RESULT,
  SAFARI_INSTALL_STEPS,
} from "../safari-install-steps/safari-install-steps";
import { SafariWindowScreen } from "./safari-window-screen";

/**
 * One surface of the flow, drawn as Safari actually shows it. Every frame here
 * was reconstructed from a capture of the real device rather than from memory.
 *
 * Note what differs between the platforms: the iPad's popover carries round
 * actions and opens collapsed, the Mac's is one flat list; the page is undimmed
 * behind a popover and dimmed behind a confirmation; and only the iPad offers
 * the web app switch.
 */
const meta = {
  title: "Components/SafariWindowScreen",
  component: SafariWindowScreen,
  parameters: { layout: "centered" },
  args: { platform: "ipad", step: SAFARI_INSTALL_STEPS.ipad[0]! },
} satisfies Meta<typeof SafariWindowScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Step 1 on both: share, at the trailing end of the toolbar. */
export const Toolbar: Story = {};

/** The iPad's popover as it opens — no list on it at all. */
export const IpadPopoverCollapsed: Story = {
  args: { step: SAFARI_INSTALL_STEPS.ipad[1]! },
};

/** The same popover grown, with the list "View More" revealed. */
export const IpadPopoverExpanded: Story = {
  args: { step: SAFARI_INSTALL_STEPS.ipad[2]! },
};

/** The iPad's confirmation: a light card, Add at the top, web app switch on. */
export const IpadConfirm: Story = {
  args: { step: SAFARI_INSTALL_STEPS.ipad[3]! },
};

/** What the four taps bought. */
export const IpadResult: Story = {
  args: { step: SAFARI_INSTALL_RESULT.ipad },
};

/** The Mac's popover: one flat list, target fifth, no expanding control. */
export const MacPopover: Story = {
  args: { platform: "mac", step: SAFARI_INSTALL_STEPS.mac[1]! },
};

/** The Mac's confirmation: a sheet on the window, confirming from the bottom. */
export const MacConfirm: Story = {
  args: { platform: "mac", step: SAFARI_INSTALL_STEPS.mac[2]! },
};

/** What the three clicks bought. */
export const MacResult: Story = {
  args: { platform: "mac", step: SAFARI_INSTALL_RESULT.mac },
};
