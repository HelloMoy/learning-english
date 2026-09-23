import { LessonId } from "@/domain/entities/ids/ids";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonWatchProgress } from "./lesson-watch-progress";

const DURATION_SECONDS = 600;

const BARELY_STARTED = LessonId.parse("11111111-1111-4111-8111-111111111111");
const PARTLY_WATCHED = LessonId.parse("22222222-2222-4222-8222-222222222222");
const FINISHED = LessonId.parse("33333333-3333-4333-8333-333333333333");
const UNTOUCHED = LessonId.parse("44444444-4444-4444-8444-444444444444");

/**
 * Seeds browser storage so each story has something to read. The component's
 * whole input is the learner store, so a story cannot show a bar without
 * writing there first.
 */
function seedPositions() {
  givenLearner.positions({ [BARELY_STARTED]: 18 });
  givenLearner.positions({ [PARTLY_WATCHED]: 240 });
  givenLearner.positions({ [FINISHED]: DURATION_SECONDS });
}

const meta: Meta<typeof LessonWatchProgress> = {
  title: "Cinema/LessonWatchProgress",
  component: LessonWatchProgress,
  args: { durationSeconds: DURATION_SECONDS },
  decorators: [
    (Story) => {
      seedPositions();
      return (
        <div className="w-96">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof LessonWatchProgress>;

export const PartlyWatched: Story = {
  args: { lessonId: PARTLY_WATCHED },
};

export const BarelyStarted: Story = {
  args: { lessonId: BARELY_STARTED },
};

/** A finished lesson reads full, so it is never confused with "almost there". */
export const Finished: Story = {
  args: { lessonId: FINISHED },
};

/**
 * A lesson the learner has never opened renders **nothing** — deliberately,
 * not by oversight. Progress arrives with the learner's snapshot after
 * hydration, so the first frame of any page necessarily shows no bars. A bar drawn
 * at zero in that frame would assert the learner has watched nothing, which
 * may be false.
 *
 * This preview is empty on purpose.
 */
export const Untouched: Story = {
  args: { lessonId: UNTOUCHED },
};

/** A reading lesson has no runtime, so there is no fraction to draw. */
export const NoRuntime: Story = {
  args: { lessonId: PARTLY_WATCHED, durationSeconds: 0 },
};
