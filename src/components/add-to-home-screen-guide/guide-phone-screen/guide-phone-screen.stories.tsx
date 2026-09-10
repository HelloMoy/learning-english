import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { INSTALL_RESULT, INSTALL_STEPS } from "../install-steps/install-steps";
import { GuidePhoneScreen } from "./guide-phone-screen";

const [MORE_STEP, SHARE_STEP, ADD_TO_HOME_STEP, ADD_STEP] = INSTALL_STEPS;

/**
 * The four iOS surfaces the guide depicts, each on its own so they can be
 * checked against the real device without waiting for the guide's timer.
 *
 * Everything here is a reconstruction of a screen recording of iOS 26 Safari.
 * The grey shapes are controls the learner does not need, kept at their true
 * position and size so the target sits where it really sits.
 */
const meta = {
  title: "Components/AddToHomeScreenGuide/GuidePhoneScreen",
  component: GuidePhoneScreen,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-background p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuidePhoneScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Step 1 — Safari's bottom bar. Note there is no share glyph on it. */
export const SafariBar: Story = { args: { step: MORE_STEP! } };

/** Step 2 — the menu behind «···», with Share at the top. */
export const MoreMenu: Story = { args: { step: SHARE_STEP! } };

/** Step 3 — the share sheet, with the target down in the list where it really is. */
export const ShareSheet: Story = { args: { step: ADD_TO_HOME_STEP! } };

/** Step 4 — the confirmation screen, including the toggle that makes it an app. */
export const ConfirmSheet: Story = { args: { step: ADD_STEP! } };

/** Step 3 in Spanish, to check the iOS label follows the locale. */
export const ShareSheetInSpanish: Story = {
  args: { step: ADD_TO_HOME_STEP! },
  parameters: { locale: "es" },
};

/** The result — the course sitting among the learner's other apps. Nothing to tap. */
export const HomeScreen: Story = { args: { step: INSTALL_RESULT } };
