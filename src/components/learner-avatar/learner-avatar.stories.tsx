import { LEARNER_ILLUSTRATION_IDS } from "@/domain/entities/learner-profile/learner-profile";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LearnerAvatar } from "./learner-avatar";

const meta = {
  title: "Components/LearnerAvatar",
  component: LearnerAvatar,
  args: { name: "Ana García", avatar: { kind: "initials" }, size: "md" },
  argTypes: {
    size: { control: { type: "select" }, options: ["sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof LearnerAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The avatar every learner starts with: their initials on gold. */
export const Initials: Story = {};

/** A single-word name gives a single letter. */
export const SingleWordName: Story = {
  args: { name: "Ana" },
};

/** One of the eight illustrations. */
export const Illustration: Story = {
  args: { avatar: { kind: "illustration", id: "wave" } },
};

/** The header chip size. */
export const Small: Story = {
  args: { size: "sm", avatar: { kind: "illustration", id: "night" } },
};

/** Every illustration side by side, for reviewing the set as a whole. */
export const AllIllustrations: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      <LearnerAvatar
        {...args}
        avatar={{ kind: "initials" }}
      />
      {LEARNER_ILLUSTRATION_IDS.map((id) => (
        <LearnerAvatar
          key={id}
          {...args}
          avatar={{ kind: "illustration", id }}
        />
      ))}
    </div>
  ),
};

/** Spanish: only the accessible name changes. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
