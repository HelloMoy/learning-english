/**
 * Storybook stories for `LoadingStatus`.
 *
 * The component is visually hidden by design, so a story that rendered it alone
 * would show an empty canvas. Each story therefore draws the live region's text
 * beside a swatch of the shapes it speaks for, and says so — what a reviewer is
 * checking here is the copy and its locale, not a layout.
 *
 * The copy comes from the production `Components.LoadingStatus` namespace, so
 * switching the toolbar locale is the review: the announcement must change with
 * it, in all three locales.
 *
 * Conventions applied:
 *   - Story structure follows the `storybook-story-writing` skill
 *   - No `Stories.*` keys — the component's own production copy is the subject
 */
import { Skeleton } from "@/components/ui/skeleton/skeleton";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { LoadingStatus } from "./loading-status";

/**
 * The live region as a screen reader receives it, next to the shapes it stands
 * for. `sr-only` is lifted here — and only here — so the copy is reviewable.
 */
function AnnouncementStory() {
  const t = useTranslations("Components.LoadingStatus");

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        role=&quot;status&quot; &rarr; <strong className="text-foreground">{t("label")}</strong>
      </p>
      <div
        aria-hidden="true"
        className="flex flex-col gap-2"
      >
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

/**
 * The component exactly as a shell mounts it — rendered, announced, and
 * invisible. The canvas is meant to look empty; that is the passing result.
 */
function AsMountedStory() {
  return <LoadingStatus />;
}

/**
 * Default story configuration for `LoadingStatus`.
 */
const meta = {
  title: "Components/LoadingStatus",
  component: LoadingStatus,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof LoadingStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Announcement: Story = { render: AnnouncementStory };
export const AsMounted: Story = { render: AsMountedStory };
