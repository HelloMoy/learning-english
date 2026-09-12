import { Skeleton } from "@/components/ui/skeleton/skeleton";

import Image from "next/image";

/**
 * What the lesson's video frame shows while the player is still booting.
 *
 * @remarks
 * The frame reserves its space from the first paint — its 16:9 box resolves
 * server-side and never shifts — but the markup inside it arrives empty: the
 * provider's `<iframe>` has no source yet, Vidstack sets the poster's `src`
 * client-side only, and the layout element carries no controls until the bundle
 * hydrates and the embed loads. What the learner gets in the meantime is a flat
 * black rectangle, which on a slow connection is the longest-lived state of the
 * page — and a black rectangle does not say "loading", it says "broken".
 *
 * This dresses that window. It is rendered by
 * `PlaybackPositionedVideoPlayer` as a **sibling** of the player, so it ships
 * inside the server-rendered HTML; a placeholder mounted from the player's
 * `children` would arrive only once the player did, which is the very gap being
 * covered.
 *
 * **The lesson's own poster is used where there is one.** It is a path this app
 * already serves, and showing the actual frame of the actual lesson beats any
 * shimmer. The silhouettes go over it regardless, because a poster on its own
 * reads as a still image rather than as a player that is coming. A lesson with
 * no poster gets those same silhouettes over a `Skeleton` fill.
 *
 * Purely decorative: `aria-hidden`, no focusable descendant, and
 * `pointer-events-none` so no tap meant for the player is swallowed on its way
 * through.
 *
 * @param poster - The lesson's thumbnail, when it declares one
 * @returns A decorative overlay covering the player's frame
 */
export function LessonVideoSkeleton({ poster }: { poster?: string }) {
  return (
    <div
      data-testid="lesson-video-skeleton"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {poster === undefined ? (
        <Skeleton
          data-testid="lesson-video-skeleton-fill"
          className="size-full rounded-none"
        />
      ) : (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          priority
          className="object-cover opacity-70"
        />
      )}

      <PlaySilhouette />
      <ControlBarSilhouette />
    </div>
  );
}

/**
 * The centred play control the layout has not drawn yet.
 *
 * Deliberately not the real `PlayButton`: this stands for a control that does
 * not exist on the page yet, and borrowing the live one would invite a click
 * that nothing can answer.
 */
function PlaySilhouette() {
  return (
    <span
      data-testid="lesson-video-skeleton-play"
      className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 sm:size-16"
    >
      {/* The glyph is a triangle drawn from borders, so it needs no icon
          import and no fill of its own — the placeholder must stay as cheap as
          the frame it is buying time for. */}
      <span className="ml-1 border-y-[10px] border-l-[16px] border-y-transparent border-l-white/80" />
    </span>
  );
}

/**
 * The control bar's outline: a progress rail with a played segment, a cluster
 * of transport controls at each end, and the time readout between them.
 *
 * Drawn in the bar's real proportions so the player's own chrome lands on top
 * of shapes that are already where it will be.
 */
function ControlBarSilhouette() {
  return (
    <div
      data-testid="lesson-video-skeleton-controls"
      className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pt-10 pb-3 sm:px-4 sm:pb-4"
    >
      <Skeleton className="h-1 w-full rounded-full bg-white/25" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full bg-white/25" />
          <Skeleton className="size-6 rounded-full bg-white/25" />
          <Skeleton className="h-3 w-20 bg-white/25" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full bg-white/25" />
          <Skeleton className="size-6 rounded-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}
