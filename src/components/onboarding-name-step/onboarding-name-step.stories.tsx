import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { OnboardingNameStep } from "./onboarding-name-step";

/**
 * A device that has not onboarded. Module scope, so the store is shared across
 * renders; saves are dropped so the story always opens on an empty card.
 */
const freshDevice: LearnerProfileRepository = { get: async () => null, set: async () => {} };

const meta = {
  title: "Components/OnboardingNameStep",
  component: OnboardingNameStep,
  args: {
    profiles: freshDevice,
    level: { number: 1, courseTitle: "Basic Course" },
    videoCount: 48,
  },
} satisfies Meta<typeof OnboardingNameStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before anything is typed: placeholder on the card, Continue unavailable. */
export const Empty: Story = {};

/** Typing fills the card and its initials. */
export const Typing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByRole("textbox", { name: "Your name" }), "Ana García");
    await expect(canvas.getByRole("button", { name: "Continue" })).toBeEnabled();
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
