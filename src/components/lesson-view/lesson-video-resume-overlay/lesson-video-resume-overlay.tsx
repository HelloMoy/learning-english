"use client";

import { Button } from "@/components/ui/button/button";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";

/**
 * The "Resume from MM:SS · Restart from beginning" choice, drawn **inside**
 * the player over the video frame.
 *
 * @remarks
 * It is a dialog by role, not by mechanism. There is no backdrop, nothing
 * outside it is marked `aria-hidden`, and it is not portalled — it is an
 * ordinary child of the player box, so it covers the video and nothing else.
 * That is the whole point of the surface: the decision is about the video, so
 * it stays within the video's bounds and leaves the rest of the lesson page
 * live behind it.
 *
 * Two accessibility affordances survive the loss of the `Dialog` primitive
 * and are implemented here by hand: focus moves to the primary action when
 * the overlay appears, so a keyboard or screen-reader user is taken to the
 * choice rather than left hunting for it, and `Escape` closes it. Focus is
 * **not** trapped — trapping is a modal behavior, and this is not modal.
 *
 * Every exit means "play". Resume and Restart are the two answers; `Escape`
 * and the close control both route to `onRestart`, because the learner
 * already asked for playback and the only open question was where from.
 *
 * It is purely a decision surface: it does not read or write storage, does
 * not touch the player, and does not decide whether it should be shown.
 * `useResumeOnFirstPlay` owns that and acts on the answer.
 *
 * @param positionSeconds - The saved position to offer, in seconds
 * @param onResume - Continue from `positionSeconds`
 * @param onRestart - Start from `0`; also the dismissal path
 */
export function LessonVideoResumeOverlay({
  positionSeconds,
  onResume,
  onRestart,
}: {
  positionSeconds: number;
  onResume: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("Components.LessonVideoResumeOverlay");
  const labelId = useId();
  const descriptionId = useId();

  // The callback lives in a ref so the key listener subscribes once. As a
  // dep it would re-subscribe on every render of the player above it.
  const onRestartRef = useRef(onRestart);
  useEffect(() => {
    onRestartRef.current = onRestart;
  }, [onRestart]);

  useEffect(() => {
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onRestartRef.current();
    };

    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-4 backdrop-blur-[2px]"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("dismissLabel")}
          onClick={onRestart}
          className="absolute top-3 right-3 text-muted-foreground"
        >
          <X aria-hidden="true" />
        </Button>

        <h2
          id={labelId}
          className="pr-8 text-2xl font-bold text-foreground"
        >
          {t("dialogLabel")}
        </h2>
        <p
          id={descriptionId}
          className="mt-2 text-sm text-muted-foreground"
        >
          {t("description")}
        </p>

        <p className="mt-5 text-lg font-semibold text-foreground">
          {t("resumeFrom", { seconds: formatMinutesSeconds(positionSeconds) })}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="lg"
            onClick={onRestart}
          >
            {t("restartCta")}
          </Button>
          <Button
            size="lg"
            autoFocus
            onClick={onResume}
          >
            {t("resumeCta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
