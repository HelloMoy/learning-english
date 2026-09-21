import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ProfileView } from "./profile-view";

const moduleId = ModuleId.parse("00000000-0000-4000-8000-000000000201");

/** Forty-eight videos, like the Basic Course. */
const lessonRuntimes = Array.from({ length: 48 }, (_, index) => ({
  id: LessonId.parse(`00000000-0000-4000-8000-${String(index).padStart(12, "0")}`),
  moduleId,
  durationSeconds: 480,
  title: `Video ${index + 1}`,
  sequence: index + 1,
}));

/**
 * A learner's stored card. Module scope, so every render shares one store;
 * saves are kept in memory for the life of the Storybook tab.
 */
let stored = LearnerProfile.parse({
  name: "Ana García",
  avatar: { kind: "illustration", id: "wave" },
});
const learner: LearnerProfileRepository = {
  get: async () => stored,
  set: async (profile) => {
    stored = profile;
  },
};

const meta = {
  title: "Components/ProfileView",
  component: ProfileView,
  args: {
    profiles: learner,
    level: { number: 1, courseTitle: "Basic Course" },
    lessonRuntimes,
    account: {
      name: "Ana García",
      email: "ana@example.com",
      signInMethods: ["password"],
    },
  },
  decorators: [
    (Story) => (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-11">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ProfileView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The stored card, nothing edited: Save waits for a change. */
export const Default: Story = {};

/** Picking another avatar previews it and enables Save. */
export const EditingTheAvatar: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("radio", { name: "Plum" }));
    await expect(canvas.getByRole("button", { name: "Save changes" })).toBeEnabled();
  },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Phone width: the card preview leads, the form follows. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
