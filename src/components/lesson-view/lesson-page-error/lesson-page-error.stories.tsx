import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonPageError } from "./lesson-page-error";

const meta = {
  title: "LessonView/LessonPageError",
  component: LessonPageError,
} satisfies Meta<typeof LessonPageError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ModuleNotInCourse: Story = {
  args: { kind: "module-not-in-course" },
};

export const LessonNotInModule: Story = {
  args: { kind: "lesson-not-in-module" },
};

export const InvalidParams: Story = {
  args: { kind: "invalid-params" },
};
