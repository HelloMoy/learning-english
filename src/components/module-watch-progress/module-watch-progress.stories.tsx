import { LessonId } from "@/domain/entities/ids/ids";
import type { LessonRuntime } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleWatchProgress } from "./module-watch-progress";

const DURATION_SECONDS = 600;

const lessonRuntimes = (count: number): LessonRuntime[] =>
  Array.from({ length: count }, (_, index) => ({
    id: LessonId.parse(`66666666-6666-4666-8666-${String(index).padStart(12, "0")}`),
    durationSeconds: DURATION_SECONDS,
  }));

const MODULE = lessonRuntimes(17);
const SHORT_MODULE = lessonRuntimes(3);

/**
 * Seeds browser storage so each story has something to count. The
 * component's whole input is the learner store, so a story cannot show a meter
 * without writing there first.
 */
function seedCompletions(completed: ReadonlyArray<LessonRuntime>) {
  for (const lesson of [...MODULE, ...SHORT_MODULE]) {
    givenLearner.notCompleted([lesson.id]);
  }
  for (const lesson of completed) {
    givenLearner.completed([lesson.id]);
  }
}

const meta: Meta<typeof ModuleWatchProgress> = {
  title: "Cinema/ModuleWatchProgress",
  component: ModuleWatchProgress,
  args: { lessonRuntimes: MODULE },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ModuleWatchProgress>;

export const PartlyCompleted: Story = {
  decorators: [
    (Story) => {
      seedCompletions(MODULE.slice(0, 7));
      return <Story />;
    },
  ],
};

/** A finished module says so, rather than leaving "17 / 17" to be read. */
export const FullyCompleted: Story = {
  args: { lessonRuntimes: SHORT_MODULE },
  decorators: [
    (Story) => {
      seedCompletions(SHORT_MODULE);
      return <Story />;
    },
  ],
};

/**
 * A module the learner has not started renders **nothing** — deliberately,
 * not by oversight. Progress arrives with the learner's snapshot after
 * hydration, so the first frame of any page necessarily shows no meters.
 *
 * This preview is empty on purpose.
 */
export const NotStarted: Story = {
  decorators: [
    (Story) => {
      seedCompletions([]);
      return <Story />;
    },
  ],
};

/** A module holding no lessons has nothing to count and nothing to divide. */
export const EmptyModule: Story = {
  args: { lessonRuntimes: [] },
  decorators: [
    (Story) => {
      seedCompletions([]);
      return <Story />;
    },
  ],
};
