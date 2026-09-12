/**
 * Storybook stories for `LessonVideoSkeleton`.
 *
 * The component is absolutely positioned against its frame, so every story
 * supplies the `relative` 16:9 wrapper the lesson page gives it — otherwise it
 * would collapse against the canvas and misrepresent its real proportions.
 *
 * The component itself renders no copy. What a reviewer is judging is whether
 * the box reads as *a player that is coming* rather than as a broken frame or a
 * still image; the only strings on screen are the two labels in
 * `BeforeAndAfter`, which live under `Stories.LessonVideoSkeleton`.
 *
 * Conventions applied:
 *   - Story structure follows the `storybook-story-writing` skill
 *   - Each exported story has a JSDoc block describing what it shows
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { LessonVideoSkeleton } from "./lesson-video-skeleton";

/** The lesson page's own frame: a rounded, bordered, black 16:9 box. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-black">
      {children}
    </div>
  );
}

/**
 * The common case: a lesson whose thumbnail is already on disk. The learner
 * sees the actual frame of the actual lesson while the player boots.
 */
function WithPosterStory() {
  return (
    <Frame>
      <LessonVideoSkeleton poster="/local-filesystem-lesson/basic-course/1-introduction/1-introduction/thumbnail.jpeg" />
    </Frame>
  );
}

/**
 * A lesson with no thumbnail: the shimmer carries the frame instead, with the
 * same silhouettes over it.
 */
function WithoutPosterStory() {
  return (
    <Frame>
      <LessonVideoSkeleton />
    </Frame>
  );
}

/**
 * What the change is worth, side by side: the undressed black frame this
 * replaces, and the placeholder that replaces it. The left box is what a
 * learner on a slow connection looked at for seconds.
 */
function BeforeAndAfterStory() {
  const t = useTranslations("Stories.LessonVideoSkeleton");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{t("before")}</p>
        <Frame>{null}</Frame>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{t("after")}</p>
        <WithPosterStory />
      </div>
    </div>
  );
}

/**
 * Default story configuration for `LessonVideoSkeleton`.
 */
const meta = {
  title: "LessonView/LessonVideoSkeleton",
  component: LessonVideoSkeleton,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof LessonVideoSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPoster: Story = { render: WithPosterStory };
export const WithoutPoster: Story = { render: WithoutPosterStory };
export const BeforeAndAfter: Story = { render: BeforeAndAfterStory };
