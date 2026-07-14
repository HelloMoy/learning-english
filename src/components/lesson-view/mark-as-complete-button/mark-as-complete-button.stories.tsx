import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { vi } from "vitest";

import { MarkAsCompleteButton } from "./mark-as-complete-button";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

void useTranslations;

const meta = {
  title: "LessonView/MarkAsCompleteButton",
  component: MarkAsCompleteButton,
} satisfies Meta<typeof MarkAsCompleteButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Incomplete: Story = {
  args: {
    lessonId: LessonId.parse(faker.string.uuid()),
    markComplete: () => Promise.resolve({ completed: true }),
  },
};

export const Complete: Story = {
  args: {
    lessonId: LessonId.parse(faker.string.uuid()),
    markComplete: () => Promise.resolve({ completed: true }),
  },
  play: async ({ canvasElement }) => {
    // The story boots the button in its "incomplete" state; the play
    // function clicks it so the snapshot shows the "complete" label.
    const { fireEvent } = await import("@testing-library/react");
    const button = canvasElement.querySelector("button");
    if (button) fireEvent.click(button);
  },
};
