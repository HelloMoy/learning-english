import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OnboardingShell } from "./onboarding-shell";

const meta = {
  title: "Components/OnboardingShell",
  component: OnboardingShell,
} satisfies Meta<typeof OnboardingShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What an onboarding step shows for the moment before storage answers. */
export const Default: Story = {};
