"use client";

import { STEP_INTERVAL_MS } from "@/hooks/use-guide-playback/use-guide-playback";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

type GuidePlaybackRailProps = {
  /** How many frames the guide cycles through, the result included. */
  frameCount: number;
  /** How many of those are taps. The rest are results, which are not numbered. */
  stepCount: number;
  /** The frame on screen. */
  frameIndex: number;
  /** Whether the guide is advancing on its own; decides if a countdown is drawn. */
  isPlaying: boolean;
  /** Asked for the frame before this one. */
  onShowPrevious: () => void;
  /** Asked for the frame after this one. */
  onShowNext: () => void;
  /** Asked for one frame by index. */
  onShowFrame: (index: number) => void;
};

const ARROW_CLASSES =
  "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

const FRAME_CLASSES =
  "inline-flex h-9 cursor-pointer items-center justify-center rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * The row of controls a guide is moved by: back, one per frame, and on.
 *
 * @remarks
 * Every guide answers a horizontal drag, and nothing announces it. On a phone
 * that was a fair trade — the gesture is an extra on top of something that
 * plays itself. It stopped being one on a Mac, where **a horizontal drag on a
 * card is not a gesture anyone performs with a mouse**: without these controls
 * a learner who missed a step can only wait out the whole loop. The gesture
 * still works and is still unannounced; it is now a shortcut for something
 * visible rather than the only way in.
 *
 * The frame controls replace the decorative dots the guides used to draw, so
 * the guide gains controls where it already had marks rather than a new row.
 * They are what lets a learner go straight to the frame they missed instead of
 * stepping back from wherever the loop has reached.
 *
 * The frame on screen carries a countdown running exactly one interval,
 * restarted by keying it on the frame. There is no second clock: the animation
 * is declarative, so it cannot drift from the timer that actually advances the
 * guide. It is drawn only while the guide is playing — under a reduced-motion
 * preference the timer does not run, and a frozen bar reads as a countdown that
 * has stalled.
 *
 * Frames past `stepCount` are results. Their controls say so rather than
 * claiming a step number the flow does not have.
 *
 * @example
 * ```tsx
 * const { frameIndex, isPlaying, showNext, showPrevious, showFrame } = useGuidePlayback(5);
 *
 * <GuidePlaybackRail
 *   frameCount={5}
 *   stepCount={4}
 *   frameIndex={frameIndex}
 *   isPlaying={isPlaying}
 *   onShowPrevious={showPrevious}
 *   onShowNext={showNext}
 *   onShowFrame={showFrame}
 * />
 * ```
 *
 * @param props - See {@link GuidePlaybackRailProps}
 * @returns The guide's control row
 * @see useGuidePlayback
 * @category Components
 */
export function GuidePlaybackRail({
  frameCount,
  stepCount,
  frameIndex,
  isPlaying,
  onShowPrevious,
  onShowNext,
  onShowFrame,
}: GuidePlaybackRailProps) {
  const t = useTranslations("Components.GuidePlaybackRail");

  const nameForFrame = (index: number) =>
    index < stepCount ? t("goToStep", { number: index + 1 }) : t("goToResult");

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label={t("previous")}
        onClick={onShowPrevious}
        className={ARROW_CLASSES}
      >
        <ChevronLeft
          aria-hidden="true"
          className="size-4"
        />
      </button>

      <ol className="flex items-center gap-1">
        {Array.from({ length: frameCount }, (_, index) => {
          const isCurrent = index === frameIndex;

          return (
            <li key={index}>
              <button
                type="button"
                aria-label={nameForFrame(index)}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onShowFrame(index)}
                className={`${FRAME_CLASSES} ${isCurrent ? "w-14 px-1.5" : "w-6"}`}
              >
                {/* The mark, not the control: the hit area above is 36px tall so
                    a finger can reach it, while the row still reads as position
                    rather than as a toolbar.

                    The frame on screen is the wide one, and its track is neutral
                    rather than a faded gold. Both are about the countdown being
                    legible: a gold bar growing across a gold track, over 20px,
                    is a countdown nobody can read. */}
                <span
                  className={
                    isCurrent
                      ? "relative h-2 w-full overflow-hidden rounded-full bg-muted-foreground/30"
                      : "size-2 rounded-full bg-muted-foreground/45"
                  }
                >
                  {isCurrent && isPlaying ? (
                    <span
                      key={frameIndex}
                      data-slot="countdown"
                      className="guide-countdown absolute inset-0 origin-left rounded-full bg-primary"
                      style={{ animationDuration: `${STEP_INTERVAL_MS}ms` }}
                    />
                  ) : null}
                  {isCurrent && !isPlaying ? (
                    <span className="absolute inset-0 rounded-full bg-primary" />
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        aria-label={t("next")}
        onClick={onShowNext}
        className={ARROW_CLASSES}
      >
        <ChevronRight
          aria-hidden="true"
          className="size-4"
        />
      </button>
    </div>
  );
}
