import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MarkAsCompleteButton } from "./mark-as-complete-button";

const meta = {
  title: "LessonView/MarkAsCompleteButton",
  component: MarkAsCompleteButton,
} satisfies Meta<typeof MarkAsCompleteButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Incomplete: Story = {
  args: {
    lessonId: LessonId.parse(faker.string.uuid()),
    markComplete: () => Promise.resolve({ data: { completed: true } }),
  },
};

export const Complete: Story = {
  args: {
    lessonId: LessonId.parse(faker.string.uuid()),
    markComplete: () => Promise.resolve({ data: { completed: true } }),
  },
  play: async ({ canvasElement }) => {
    // The story boots the button in its "incomplete" state; the play
    // function clicks it so the snapshot shows the "complete" label.
    const { fireEvent } = await import("@testing-library/react");
    const button = canvasElement.querySelector("button");
    if (button) fireEvent.click(button);
  },
};
