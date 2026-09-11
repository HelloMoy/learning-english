"use client";

import { Button } from "@/components/ui/button/button";
import { useFitScale } from "@/hooks/use-fit-scale/use-fit-scale";
import { useHorizontalSwipe } from "@/hooks/use-horizontal-swipe/use-horizontal-swipe";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { GuidePhoneScreen, PHONE_HEIGHT } from "../guide-phone-screen/guide-phone-screen";
import { INSTALL_RESULT, INSTALL_STEPS } from "../install-steps/install-steps";

/**
 * What the loop cycles through: the four taps, then what they bought.
 *
 * `INSTALL_STEPS` stays the four taps on its own, so the numbering can keep
 * counting the work rather than the reward.
 */
const FRAMES = [...INSTALL_STEPS, INSTALL_RESULT];

/**
 * How long each step stays on screen.
 *
 * @remarks
 * Exported so the tests drive the same clock the component does, rather than
 * hard-coding a duplicate of it that can drift.
 *
 * @category Components
 */
export const STEP_INTERVAL_MS = 3_500;

type GuideAutoplayProps = {
  /**
   * Called when the learner dismisses the guide. The caller decides what
   * dismissal means — see the remarks on {@link GuideAutoplay}.
   */
  onDismiss: () => void;
};

/**
 * The frame `delta` away, both ends wrapping.
 *
 * @remarks
 * The `+ FRAMES.length` is what makes stepping back from the first frame land
 * on the last instead of on `-1`.
 */
const frameAfter = (index: number, delta: number) =>
  (index + delta + FRAMES.length) % FRAMES.length;

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * The install guide, playing itself: the four steps on a loop, and a drag to
 * move it by hand.
 *
 * @remarks
 * It is the prototype video's pacing, rebuilt from components so that the iOS
 * labels it shows can be translated — the one thing the rendered MP4 could
 * never do. A self-paced stepper was built alongside it and compared; this one
 * was kept, and the other deleted.
 *
 * What it buys is that the learner does nothing: the flow just runs. What that
 * costs is the learner who looks away — at the «···» they were sent to find, or
 * at Safari's own menu covering the page — and comes back to a guide that has
 * moved on. Two things answer that. It says which step is showing and how many
 * there are, rather than looping anonymously; and a horizontal drag moves it a
 * frame either way, so the frame they missed is one gesture back rather than a
 * whole loop away.
 *
 * The gesture is a nudge, not a takeover. There is no pause, and no manual mode
 * to get stranded in: the loop plays on, and the frame the learner landed on
 * simply gets a full interval of its own before it does — which is what the
 * per-frame timer below is for.
 *
 * The steps come from {@link INSTALL_STEPS}.
 *
 * Under `prefers-reduced-motion` it does not advance at all. The preference is
 * read after mount — it cannot be known while rendering on the server — so the
 * first step is painted either way and only the movement is conditional. The
 * drag keeps working there, and is the only thing that does: the preference
 * silences motion the learner did not ask for, and this is the motion they did.
 *
 * It holds no dismissal state; `onDismiss` hands that to the caller.
 *
 * @example
 * ```tsx
 * <GuideAutoplay onDismiss={() => setGuideHidden(true)} />
 * ```
 *
 * @param props - See {@link GuideAutoplayProps}
 * @returns The guide as a labelled group, cycling through the steps and
 * answering a horizontal drag
 * @category Components
 */
export function GuideAutoplay({ onDismiss }: GuideAutoplayProps) {
  const t = useTranslations("Components.AddToHomeScreenGuide");
  const labelId = useId();
  const [frameIndex, setFrameIndex] = useState(0);
  const { ref: depictionRef, scale: depictionScale } = useFitScale(PHONE_HEIGHT);

  const showNextFrame = () => setFrameIndex((current) => frameAfter(current, 1));
  const showPreviousFrame = () => setFrameIndex((current) => frameAfter(current, -1));

  // Leftwards is forwards: the finger travels the way the dots are laid out.
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: showNextFrame,
    onSwipeRight: showPreviousFrame,
  });

  // One timer per frame rather than one interval for the whole loop: the wait
  // starts again whenever the frame changes, so a learner who moves the guide
  // by hand gets the frame they chose for its full time instead of for
  // whatever was left of the tick they interrupted.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const timer = setTimeout(() => setFrameIndex(frameAfter(frameIndex, 1)), STEP_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [frameIndex]);

  const frame = FRAMES[frameIndex]!;
  const isResult = frame.surface === "home-screen";

  // The height bound is in viewport units rather than `max-h-full`: a
  // percentage max-height resolved against a parent whose own height is auto
  // computes to `none`, so the percentage version bounded nothing and the modal
  // simply clipped the depiction instead of shrinking it.
  return (
    <section
      aria-labelledby={labelId}
      {...swipeHandlers}
      className="relative flex max-h-[calc(100svh-2rem)] flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5 pt-6 text-foreground shadow-lg"
    >
      <header className="w-full pr-8 text-center">
        <h2
          id={labelId}
          className="text-base font-semibold text-balance"
        >
          {t("label")}
        </h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{t("payoff")}</p>
      </header>

      {/* `min-h-0` is what lets this shrink below the depiction's natural
          height at all, and `overflow-hidden` is what stops the height the
          transform leaves behind from producing the very scrollbar the
          shrinking exists to remove. */}
      <div
        ref={depictionRef}
        className="flex min-h-0 w-full flex-1 justify-center overflow-hidden"
      >
        {/* `w-fit` matters: a full-width box would put the fixed-width
            depiction at its left edge, and scaling about the box's centre
            would then drag it off the guide's centre. Shrunk to the
            depiction, the box's centre and the depiction's are the same
            point, and `justify-center` puts that point in the middle. */}
        <div
          className="w-fit"
          style={{ transform: `scale(${depictionScale})`, transformOrigin: "top center" }}
        >
          <GuidePhoneScreen step={frame} />
        </div>
      </div>

      <p
        aria-live="polite"
        className="min-h-10 text-center text-sm text-pretty"
      >
        {isResult ? null : (
          <span className="mr-1.5 font-semibold text-primary">
            {t("progress", { current: frameIndex + 1, total: INSTALL_STEPS.length })}
          </span>
        )}
        {t(frame.messageKey)}
      </p>

      <ol className="flex items-center gap-1.5">
        {FRAMES.map((each, index) => (
          <li
            key={each.messageKey}
            aria-hidden="true"
            className={
              index === frameIndex
                ? "h-1.5 w-5 rounded-full bg-primary transition-all"
                : "size-1.5 rounded-full bg-muted-foreground/40 transition-all"
            }
          />
        ))}
      </ol>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("dismiss")}
        onClick={onDismiss}
        className="absolute top-3 right-3 rounded-full"
      >
        <X aria-hidden="true" />
      </Button>
    </section>
  );
}
