import { StartCourseLink } from "@/components/start-course-link/start-course-link";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ContinueBand } from "./continue-band";

const moduleId = ModuleId.parse("00000000-0000-4000-8000-000000000201");

/** Forty-eight videos, like the Basic Course. */
const lessonRuntimes = Array.from({ length: 48 }, (_, index) => ({
  id: LessonId.parse(`00000000-0000-4000-8000-${String(index).padStart(12, "0")}`),
  moduleId,
  durationSeconds: 480,
}));

const profile = LearnerProfile.parse({
  name: "Ana García",
  avatar: { kind: "illustration", id: "plum" },
});

/** Module scope, so the action's store is shared across renders and reads Continue. */
const learner: LearnerProfileRepository = { get: async () => profile, set: async () => {} };

const meta = {
  title: "Components/ContinueBand",
  component: ContinueBand,
  args: {
    profile,
    level: { number: 1, courseTitle: "Basic Course" },
    lessonRuntimes,
    action: <StartCourseLink profiles={learner} />,
  },
} satisfies Meta<typeof ContinueBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The closing band for a learner who already has a card. */
export const Default: Story = {};

/** Initials instead of an illustration. */
export const WithInitials: Story = {
  args: { profile: LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } }) },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width: the card sits between the greeting and Continue. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
