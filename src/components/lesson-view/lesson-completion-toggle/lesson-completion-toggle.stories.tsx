import { LessonId } from "@/domain/entities/ids/ids";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonCompletionToggle } from "./lesson-completion-toggle";

/**
 * The lesson's completion control. The invitation above the button is
 * phone-only, so review this at `mobile1`; the completed state — the
 * statement and the quiet "Unmark" action — shows at every width.
 */
const meta = {
  title: "LessonView/LessonCompletionToggle",
  component: LessonCompletionToggle,
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: {
    markComplete: () => Promise.resolve({ data: { completed: true } }),
    unmarkComplete: () => Promise.resolve({ data: { unmarked: true } }),
  },
  decorators: [
    (Story) => (
      <NiceModal.Provider>
        <Story />
      </NiceModal.Provider>
    ),
  ],
} satisfies Meta<typeof LessonCompletionToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The lesson is still open: the invitation and the primary action. */
export const Incomplete: Story = {
  args: { lessonId: LessonId.parse(faker.string.uuid()) },
};

/**
 * The lesson is done. Completion is stated once and the undo sits beside it —
 * activating it opens the confirmation dialog.
 */
export const Complete: Story = {
  args: { lessonId: LessonId.parse(faker.string.uuid()) },
  play: async ({ canvasElement }) => {
    // The story boots in the incomplete state; the play function marks the
    // lesson so the snapshot shows the completed one.
    const { fireEvent } = await import("@testing-library/react");
    const button = canvasElement.querySelector("button");
    if (button) fireEvent.click(button);
  },
};
