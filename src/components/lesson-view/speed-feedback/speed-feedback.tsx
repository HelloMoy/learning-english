"use client";

import { ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The pill drawn over the video while a press-and-hold runs it faster: the
 * rate in force and a pair of chevrons pointing the way it is running.
 *
 * @remarks
 * It is an ordinary child of the player box, absolutely positioned against
 * it, so it moves with the pinned player and needs no portal. Whether it is
 * on screen is not its decision: the player's gesture helper renders it while
 * a hold is armed and unmounts it when the finger lifts.
 *
 * **It never takes the pointer.** The press that keeps the hold alive lands
 * on the provider underneath, and an indicator that swallowed it would end
 * the very hold it shows.
 *
 * **The direction lives in the glyph, not in a class.** `ChevronsRight` —
 * never a left-pointing glyph flipped by a transform. `ScrollDownHint`
 * records why: a phone that picks up new JS while holding a cached
 * stylesheet must still draw a glyph that points the way the video is
 * running.
 *
 * The rate reaches the copy as a **number**, so each locale renders its own
 * digits and decimal mark rather than a string this component formatted.
 *
 * `role="status"` lets assistive technology hear the speed-up without focus
 * leaving the player. A chevron states nothing there, so `speedingUp` carries
 * the speed in words and the visible pill is `aria-hidden` — both sit in the
 * same region, and without that the rate is read twice.
 *
 * @param rate - The playback rate the hold is applying, e.g. `2`
 *
 * @category Components
 */
export function SpeedFeedback({ rate }: { rate: number }) {
  const t = useTranslations("Components.SpeedFeedback");

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-0 top-4 z-10 flex animate-in justify-center duration-200 fade-in slide-in-from-top-2 motion-reduce:animate-none"
    >
      <span className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-sm font-semibold text-white">
        <span aria-hidden="true">{t("rate", { rate })}</span>
        <ChevronsRight
          aria-hidden="true"
          className="size-4"
        />
      </span>
      <span className="sr-only">{t("speedingUp", { rate })}</span>
    </div>
  );
}
