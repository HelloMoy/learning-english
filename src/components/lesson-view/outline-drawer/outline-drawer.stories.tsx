import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { OutlineDrawer } from "./outline-drawer";
import {
  clearWatchProgress,
  makeCourseFixture,
  seedCompletedLessons,
} from "./outline-drawer-fixture";

/** A small course, for the shape-of-the-shell stories. */
const smallCourse = makeCourseFixture({ lessonsPerModule: [2] });

/**
 * A course the size of the real one: many modules, and the current lesson deep
 * inside a late one. This is the shape that made the outline unable to show the
 * learner where they were — the sidebar was taller than the viewport and opened
 * on module 1.
 */
const longCourse = makeCourseFixture({
  lessonsPerModule: [9, 12, 27, 14, 11, 9, 9, 9, 9, 9, 9, 9, 9, 9],
  currentModuleIndex: 11,
  currentLessonIndex: 4,
});

/**
 * Seeds the browser's completion store before the story renders.
 *
 * @param completedLessonCount - How many of the long course's lessons to mark done
 * @returns A decorator that leaves the store holding exactly that much progress
 */
const withCompletedLessons = (completedLessonCount: number): Decorator =>
  function WithCompletedLessons(Story) {
    clearWatchProgress();
    seedCompletedLessons(longCourse.lessons.slice(0, completedLessonCount));
    return <Story />;
  };

const meta = {
  title: "LessonView/OutlineDrawer",
  component: OutlineDrawer,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
} satisfies Meta<typeof OutlineDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  args: smallCourse.props,
  parameters: { viewport: { defaultViewport: "desktop" } },
};

export const Mobile: Story = {
  args: smallCourse.props,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const LongCourseDesktop: Story = {
  args: longCourse.props,
  parameters: { viewport: { defaultViewport: "desktop" } },
  decorators: [
    // Mimics the lesson page: the outline is one column of a grid whose
    // other column is long enough to make the page scroll.
    function InLessonGrid(Story) {
      return (
        <div className="grid gap-8 p-4 lg:grid-cols-[260px_1fr]">
          <Story />
          <div className="h-[3000px] rounded-2xl border border-border bg-card" />
        </div>
      );
    },
  ],
};

export const LongCourseMobile: Story = {
  args: longCourse.props,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

/** Part of the way through — the edge meter carries the whole reading. */
export const MobilePartWayThrough: Story = {
  args: longCourse.props,
  parameters: { viewport: { defaultViewport: "mobile1" } },
  decorators: [withCompletedLessons(45)],
};

/** The same row with its outline open, scrolled to the current lesson. */
export const MobileExpanded: Story = {
  args: longCourse.props,
  parameters: { viewport: { defaultViewport: "mobile1" } },
  decorators: [withCompletedLessons(45)],
  play: async ({ canvasElement }) => {
    canvasElement.querySelector("details")?.setAttribute("open", "");
  },
};

/**
 * A learner who has completed nothing: the edge track draws, but the row makes
 * no claim about progress.
 */
export const MobileNoProgress: Story = {
  args: longCourse.props,
  parameters: { viewport: { defaultViewport: "mobile1" } },
  decorators: [withCompletedLessons(0)],
};

/** A finished course, where the edge meter runs the card's full width. */
export const MobileCourseComplete: Story = {
  args: longCourse.props,
  parameters: { viewport: { defaultViewport: "mobile1" } },
  decorators: [withCompletedLessons(longCourse.lessons.length)],
};
