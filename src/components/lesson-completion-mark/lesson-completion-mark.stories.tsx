import { LessonId } from "@/domain/entities/ids/ids";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LessonCompletionMark } from "./lesson-completion-mark";

const STORAGE_KEY_PREFIX = "learning-english:completed:";
const PLAYBACK_KEY_PREFIX = "learning-english:playback:";

const DURATION_SECONDS = 600;

const COMPLETED = LessonId.parse("11111111-1111-4111-8111-111111111111");
const NOT_COMPLETED = LessonId.parse("22222222-2222-4222-8222-222222222222");
const WATCHED_TO_THE_END = LessonId.parse("33333333-3333-4333-8333-333333333333");

/**
 * Seeds browser storage so the "completed" stories have something to read.
 * The component's whole input is `localStorage`, so a story cannot show the
 * completed state without writing there first.
 */
function seedCompletion() {
  window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${COMPLETED}`, "1");
  window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${NOT_COMPLETED}`);
  window.localStorage.removeItem(`${STORAGE_KEY_PREFIX}${WATCHED_TO_THE_END}`);
  window.localStorage.setItem(
    `${PLAYBACK_KEY_PREFIX}${WATCHED_TO_THE_END}`,
    String(DURATION_SECONDS),
  );
  refreshSavedPlaybackPositions();
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
