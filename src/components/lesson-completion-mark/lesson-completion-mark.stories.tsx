import { LessonId } from "@/domain/entities/ids/ids";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonCompletionMark } from "./lesson-completion-mark";

const DURATION_SECONDS = 600;

const COMPLETED = LessonId.parse("11111111-1111-4111-8111-111111111111");
const NOT_COMPLETED = LessonId.parse("22222222-2222-4222-8222-222222222222");
const WATCHED_TO_THE_END = LessonId.parse("33333333-3333-4333-8333-333333333333");

/**
 * Seeds the learner store so the "completed" stories have something to read.
 * The component's whole input is the learner's completion, so a story cannot
 * show the completed state without seeding it first.
 */
function seedCompletion() {
  givenLearner.completed([COMPLETED]);
  givenLearner.notCompleted([NOT_COMPLETED, WATCHED_TO_THE_END]);
  givenLearner.positions({ [WATCHED_TO_THE_END]: DURATION_SECONDS });
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
 * The other producer of completion: a video watched to its end, with the
 * button never pressed. The caller supplies the runtime, so the mark can
 * apply the finish rule; a caller that knows no runtime falls back to the
 * stored mark alone.
 */
export const WatchedToTheEnd: Story = {
  args: { lessonId: WATCHED_TO_THE_END, durationSeconds: DURATION_SECONDS },
};

/**
 * An uncompleted lesson renders **nothing** — deliberately, not by oversight.
 *
 * Completion arrives with the learner's snapshot after hydration, so the
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
