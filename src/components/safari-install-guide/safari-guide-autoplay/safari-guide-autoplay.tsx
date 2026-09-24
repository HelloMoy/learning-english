"use client";

import { GuidePlaybackRail } from "@/components/guide-playback-rail/guide-playback-rail";
import { Button } from "@/components/ui/button/button";
import { useFitScale } from "@/hooks/use-fit-scale/use-fit-scale";
import { useGuidePlayback } from "@/hooks/use-guide-playback/use-guide-playback";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import {
  isSafariInstallStep,
  SAFARI_INSTALL_RESULT,
  SAFARI_INSTALL_STEPS,
  type SafariPlatform,
} from "../safari-install-steps/safari-install-steps";
import {
  SAFARI_WINDOW_SIZE,
  SafariWindowScreen,
} from "../safari-window-screen/safari-window-screen";

type SafariGuideAutoplayProps = {
  /** Which Safari the learner is on; decides the steps, the copy and the frame. */
  platform: SafariPlatform;
  /**
   * Called when the learner dismisses the guide. The caller decides what
   * dismissal means — see the remarks on {@link SafariGuideAutoplay}.
   */
  onDismiss: () => void;
};

/**
 * The Safari install guide, playing itself: one platform's taps on a loop, and
 * a drag to move it by hand.
 *
 * @remarks
 * The iPad's and the Mac's guide are the same component because they are the
 * same guide with different contents: the steps come from
 * {@link SAFARI_INSTALL_STEPS}, the copy from a namespace keyed by platform, and
 * the picture from {@link SafariWindowScreen}. Nothing about the playing is
 * per-platform, so nothing about the playing is written twice.
 *
 * The pacing, the wrap and the gesture live in {@link useGuidePlayback}, which
 * the iPhone guide reads from too. All three are specified to behave the same
 * way, and that is the one place that says how.
 *
 * The step counter counts **taps**, not frames. The result is a frame and not a
 * tap: the learner does nothing on it, so numbering it would tell them the flow
 * costs one more step than it does.
 *
 * It holds no dismissal state; `onDismiss` hands that to the caller.
 *
 * @example
 * ```tsx
 * <SafariGuideAutoplay platform="ipad" onDismiss={modal.hide} />
 * ```
 *
 * @param props - See {@link SafariGuideAutoplayProps}
 * @returns The guide as a labelled group, cycling through the steps and
 * answering a horizontal drag
 * @category Components
 */
export function SafariGuideAutoplay({ platform, onDismiss }: SafariGuideAutoplayProps) {
  const t = useTranslations("Components.SafariInstallGuide");
  const labelId = useId();

  const steps = SAFARI_INSTALL_STEPS[platform];
  const frames = [...steps, SAFARI_INSTALL_RESULT[platform]];

  const { frameIndex, isPlaying, showNext, showPrevious, showFrame, swipeHandlers } =
    useGuidePlayback(frames.length);
  const { ref: depictionRef, scale: depictionScale } = useFitScale(
    SAFARI_WINDOW_SIZE[platform].height + 12,
  );

  const frame = frames[frameIndex]!;
  const isResult = !isSafariInstallStep(frame);

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
          {t(`${platform}Label`)}
        </h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{t(`${platform}Payoff`)}</p>
      </header>

      {/* `min-h-0` is what lets this shrink below the depiction's natural height
          at all, and `overflow-hidden` is what stops the height the transform
          leaves behind from producing the very scrollbar the shrinking exists
          to remove. */}
      <div
        ref={depictionRef}
        className="flex min-h-0 w-full flex-1 justify-center overflow-hidden"
      >
        {/* `w-fit` matters: a full-width box would put the fixed-width depiction
            at its left edge, and scaling about the box's centre would then drag
            it off the guide's centre. */}
        <div
          className="w-fit"
          style={{ transform: `scale(${depictionScale})`, transformOrigin: "top center" }}
        >
          <SafariWindowScreen
            platform={platform}
            step={frame}
          />
        </div>
      </div>

      <p
        aria-live="polite"
        className="min-h-10 text-center text-sm text-pretty"
      >
        {isResult ? null : (
          <span className="mr-1.5 font-semibold text-primary">
            {t("progress", { current: frameIndex + 1, total: steps.length })}
          </span>
        )}
        {t(frame.messageKey)}
      </p>

      <GuidePlaybackRail
        frameCount={frames.length}
        stepCount={steps.length}
        frameIndex={frameIndex}
        isPlaying={isPlaying}
        onShowPrevious={showPrevious}
        onShowNext={showNext}
        onShowFrame={showFrame}
      />

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
