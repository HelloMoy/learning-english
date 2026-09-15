import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { StartCourseLink } from "./start-course-link";

/** A device that has not onboarded. Built once, so every render shares its store. */
const noProfile: LearnerProfileRepository = { get: async () => null, set: async () => {} };

/** A device whose learner has a card. */
const withProfile: LearnerProfileRepository = {
  get: async () => LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }),
  set: async () => {},
};

const meta = {
  title: "Components/StartCourseLink",
  component: StartCourseLink,
  args: { profiles: noProfile },
} satisfies Meta<typeof StartCourseLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First visit: the action opens the onboarding. */
export const FirstVisit: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Start course" });
    await expect(link.getAttribute("href")).toMatch(/\/start$/);
  },
};

/** A learner with a card is invited to continue, straight to My learning. */
export const ReturningLearner: Story = {
  args: { profiles: withProfile },
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link", { name: "Continue" });
    await expect(link.getAttribute("href")).toMatch(/\/learning$/);
  },
};

/** Spanish label. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
