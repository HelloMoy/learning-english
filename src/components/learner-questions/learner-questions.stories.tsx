import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LearnerQuestions } from "./learner-questions";

const meta = {
  title: "Components/LearnerQuestions",
  component: LearnerQuestions,
} satisfies Meta<typeof LearnerQuestions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The three questions a new visitor asks before the first lesson. */
export const Default: Story = {};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
