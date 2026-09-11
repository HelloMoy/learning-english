"use client";

import type { SeekDirection } from "@/lib/seek-run/seek-run";
import { cn } from "@/lib/utils/utils";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Offsets that make three identical chevrons light up in sequence, so the
 * group reads as travel in one direction rather than as a blink.
 */
const CHEVRON_DELAYS_MS = [0, 120, 240];

/**
 * The indicator drawn over the tapped half of the video while a seek run is
 * active: a translucent half-disc, three chevrons pointing the way the video
 * moved, and the seconds the run has seeked so far.
 *
 * @remarks
 * It is an ordinary child of the player box, absolutely positioned against
 * it, so it moves with the pinned player and needs no portal. Whether it is
 * on screen is not its decision: the player's gesture helper renders it while
 * a run is active and unmounts it when the run lapses.
 *
 * **It never takes the pointer.** The taps that keep a run alive land on the
 * provider underneath, and an indicator that swallowed them would end the
 * very run it shows.
 *
 * **The direction lives in the glyph, not in a class.** `ChevronLeft` for a
 * backward run and `ChevronRight` for a forward one — never one glyph flipped
 * by a transform. `ScrollDownHint` records why: a phone that picks up new JS
 * while holding a cached stylesheet must still draw chevrons that point the
 * way the video moved. What CSS carries here is the pulse, and a stylesheet
 * that never arrives costs the motion, never the direction.
 *
 * `role="status"` lets assistive technology hear the seek without focus
 * leaving the player. A chevron states nothing there, so `forward` /
 * `backward` carry the direction in words and the visible count is
 * `aria-hidden` — both sit in the same region, and without that the seconds
 * are read twice. The pulse is dropped under `prefers-reduced-motion`, which
 * leaves the still chevrons and the count.
 *
 * @param direction - The way the run moved the video; picks the side and the glyph
 * @param seconds - The seconds the run has seeked so far, for the label
 *
 * @category Components
 */
export function SeekFeedback({
  direction,
  seconds,
}: {
  direction: SeekDirection;
  seconds: number;
}) {
  const t = useTranslations("Components.SeekFeedback");
  const Chevron = direction === "forward" ? ChevronRight : ChevronLeft;

  return (
    <div
      role="status"
      data-direction={direction}
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 flex w-[42%] animate-in flex-col items-center justify-center gap-1 bg-white/15 text-white duration-200 zoom-in-95 fade-in motion-reduce:animate-none",
        direction === "forward" ? "right-0 rounded-l-[100%]" : "left-0 rounded-r-[100%]",
      )}
    >
      <span
        aria-hidden="true"
        className="flex"
      >
        {CHEVRON_DELAYS_MS.map((delayMs) => (
          <Chevron
            key={delayMs}
            className="size-7 animate-seek-pulse motion-reduce:animate-none"
            style={{ animationDelay: `${delayMs}ms` }}
          />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="text-sm font-medium"
      >
        {t("seconds", { count: seconds })}
      </span>
      <span className="sr-only">{t(direction, { count: seconds })}</span>
    </div>
  );
}
