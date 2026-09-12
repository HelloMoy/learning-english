/**
 * Storybook stories for the shadcn/ui `Skeleton` primitive.
 *
 * The primitive renders no copy, so these stories carry no translations: what
 * a reviewer needs to judge is shape, not words. Each story shows one of the
 * shapes the app actually composes from it, and `PageShell` shows the point of
 * the primitive — several of them arranged in a real layout's containers.
 *
 * Conventions applied:
 *   - Story structure follows the `storybook-story-writing` skill
 *   - Each exported story has a JSDoc block describing what it shows
 *   - No `Stories.*` keys are needed, because no story renders user copy
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "./skeleton";

/** A single line of text waiting to arrive — the smallest useful shape. */
function LineStory() {
  return <Skeleton className="h-4 w-64" />;
}

/** A heading, wider and taller than a body line. */
function HeadingStory() {
  return <Skeleton className="h-9 w-80" />;
}

/** An avatar or icon well — the primitive's rounding overridden to a circle. */
function CircleStory() {
  return <Skeleton className="size-11 rounded-full" />;
}

/** The lesson player's frame: the shape this change exists to dress. */
function VideoFrameStory() {
  return <Skeleton className="aspect-video w-full max-w-2xl rounded-2xl" />;
}

/**
 * Several shapes in a real layout's containers — a heading, a frame, a title
 * and two body lines. This is how the primitive is meant to be used: the
 * arriving content fills positions that are already correct, rather than
 * re-laying the page out when it lands.
 */
function PageShellStory() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-8 w-2/3" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

/**
 * Default story configuration for the `Skeleton` primitive.
 *
 * `layout: "padded"` rather than `"centered"` because these shapes are sized
 * against a container's width, and centring them in an unconstrained canvas
 * misrepresents how they behave on a page.
 */
const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = { render: LineStory };
export const Heading: Story = { render: HeadingStory };
export const Circle: Story = { render: CircleStory };
export const VideoFrame: Story = { render: VideoFrameStory };
export const PageShell: Story = { render: PageShellStory };
