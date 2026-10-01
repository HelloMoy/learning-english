import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { FirstCourseStep } from "./first-course-step";

/** A device that finished steps 1 and 2. Module scope, so every render shares one store. */
const afterStepTwo: LearnerProfileRepository = {
  get: async () =>
    LearnerProfile.parse({ name: "Ana García", avatar: { kind: "illustration", id: "echo" } }),
  set: async () => {},
};

const meta = {
  title: "Components/FirstCourseStep",
  component: FirstCourseStep,
  parameters: { layout: "padded" },
  args: { profiles: afterStepTwo, course: BASIC_COURSE_VIEW },
  decorators: [
    (Story) => (
      <NuqsTestingAdapter>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
} satisfies Meta<typeof FirstCourseStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Step 3 of the onboarding: the Basic Course, recommended. */
export const Onboarding: Story = {};

/** Sent here by My learning (enrolled in nothing): the same page without the step indicator. */
export const FromMyLearning: Story = {
  decorators: [
    (Story) => (
      <NuqsTestingAdapter searchParams="?from=learning">
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
