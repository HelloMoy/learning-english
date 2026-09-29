import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OnboardingProgress } from "./onboarding-progress";

const meta = {
  title: "Components/OnboardingProgress",
  component: OnboardingProgress,
  args: { step: 1 },
  argTypes: { step: { control: { type: "inline-radio" }, options: [1, 2, 3] } },
} satisfies Meta<typeof OnboardingProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The name step. */
export const StepOne: Story = {};

/** The avatar step. */
export const StepTwo: Story = {
  args: { step: 2 },
};

/** The first-course step. */
export const StepThree: Story = {
  args: { step: 3 },
};

/** Portuguese label. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
