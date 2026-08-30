import { LessonId } from "@/domain/entities/ids/ids";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonCompletionMark } from "./lesson-completion-mark";

const STORAGE_KEY_PREFIX = "learning-english:completed:";

const COMPLETED = LessonId.parse("11111111-1111-4111-8111-111111111111");
const NOT_COMPLETED = LessonId.parse("22222222-2222-4222-8222-222222222222");

/**
 * Seeds browser storage so the "completed" story has something to read.
 * The component's whole input is `localStorage`, so a story cannot show the
 * completed state without writing there first.
 */
function seedCompletion() {
  window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${COMPLETED}`, "1");
  window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${NOT_COMPLETED}`);
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
}

const meta: Meta<typeof LessonCompletionMark> = {
  title: "Components/LessonCompletionMark",
  component: LessonCompletionMark,
  decorators: [
    (Story) => {
      seedCompletion();
      return <Story />;
    },
  ],
};

export default meta;

type Story = StoryObj<typeof LessonCompletionMark>;

/**
 * A completed lesson. The check is decorative; the meaning is carried by a
 * visually hidden, localized label, so the state is not signalled by colour
 * or glyph alone.
 */
export const Completed: Story = {
  args: { lessonId: COMPLETED },
};

/**
 * An uncompleted lesson renders **nothing** — deliberately, not by oversight.
 *
 * Completion lives in `localStorage`, which the server cannot read, so the
 * first frame of any page necessarily shows no marks. If this component also
 * drew a "not completed" state, that frame would assert something false
 * about the learner's progress. Absence is the neutral state, so hydration
 * only ever adds a mark.
 *
 * This preview is empty on purpose.
 */
export const NotCompleted: Story = {
  args: { lessonId: NOT_COMPLETED },
};
