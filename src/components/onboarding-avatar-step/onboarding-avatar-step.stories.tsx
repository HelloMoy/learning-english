import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { OnboardingAvatarStep } from "./onboarding-avatar-step";

/** A device that finished step 1. Module scope, so every render shares one store. */
const afterStepOne: LearnerProfileRepository = {
  get: async () => LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
  set: async () => {},
};

const meta = {
  title: "Components/OnboardingAvatarStep",
  component: OnboardingAvatarStep,
  args: {
    profiles: afterStepOne,
    level: { number: 1, courseTitle: "Basic Course" },
    videoCount: 48,
  },
} satisfies Meta<typeof OnboardingAvatarStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The card from step 1, initials checked. */
export const InitialsChecked: Story = {};

/** Picking Echo puts it on the card. */
export const PickingEcho: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const echo = await canvas.findByRole("radio", { name: "Echo" });
    await userEvent.click(echo);
    await expect(echo).toHaveAttribute("aria-checked", "true");
  },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

/** Phone width: the picker wraps to three columns. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
