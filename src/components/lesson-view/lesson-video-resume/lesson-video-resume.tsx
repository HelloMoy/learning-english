"use client";

import { useTranslations } from "next-intl";

/**
 * Resume-position thresholds (in seconds). A saved position renders the
 * overlay only when both bounds hold:
 *
 * - `MIN_SECONDS_FROM_START` — below this, the learner effectively hasn't
 *   watched anything; auto-resume looks broken (video jumps mid-intro).
 * - `SECONDS_NEAR_END` — within the last N seconds of `durationSeconds`,
 *   the learner effectively finished; resume would show "you watched it
 *   all, except the last 3s" and feel broken.
 *
 * See `openspec/changes/2026-07-26-lesson-playback-resume/design.md` §D4.
 */
export const MIN_SECONDS_FROM_START = 30;
export const SECONDS_NEAR_END = 10;

/**
 * Returns true when the saved `positionSeconds` is meaningful enough to
 * resume from (not noise, not "basically finished"). Both bounds must
 * hold. `durationSeconds <= 0` is treated as unknown and the overlay is
 * not rendered.
 */
export const isPositionResumable = (
  positionSeconds: number | null,
  durationSeconds: number,
): positionSeconds is number => {
  if (positionSeconds === null) return false;
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0) return false;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return false;
  if (positionSeconds < MIN_SECONDS_FROM_START) return false;
  if (positionSeconds >= durationSeconds - SECONDS_NEAR_END) return false;
  return true;
};

const formatMinutesSeconds = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * The "Resume from MM:SS · Restart from beginning" overlay that appears
 * above the video player when a saved position passes the thresholds.
 *
 * Two actions only:
 * - `onResume(seconds)` — primary CTA; the player wrapper receives the
 *   saved seconds and seeks there.
 * - `onRestart` — secondary CTA; the wrapper seeks to 0.
 *
 * The overlay is purely presentational: it does not read or write
 * storage itself. Persistence belongs to `PlaybackPositionedVideoPlayer`
 * and the `recordPlaybackPositionAction` server function.
 *
 * Accessibility:
 * - `role="dialog"` with localized `aria-label`.
 * - `aria-live="polite"` so screen readers learn about the option
 *   without focus stealing.
 *
 * Auto-dismiss on inactivity is left to the host (`PlaybackPositionedVideoPlayer`)
 * for now — it requires careful interaction with `userEvent` fake timers
 * that doesn't belong in this presentational layer.
 */
export function LessonVideoResume({
  positionSeconds,
  durationSeconds,
  onResume,
  onRestart,
}: {
  positionSeconds: number | null;
  durationSeconds: number;
  onResume: (seconds: number) => void;
  onRestart: () => void;
}) {
  const t = useTranslations("Components.LessonVideoResume");

  if (!isPositionResumable(positionSeconds, durationSeconds)) {
    return null;
  }

  const timestamp = formatMinutesSeconds(positionSeconds);

  return (
    <div
      role="dialog"
      aria-label={t("dialogLabel")}
      aria-live="polite"
      className="pointer-events-auto absolute inset-x-4 top-4 z-20 mx-auto max-w-md rounded-lg border border-border bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="flex flex-col gap-3">
        <p className="text-lg font-semibold text-foreground">
          {t("resumeFrom", { seconds: timestamp })}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onResume(positionSeconds)}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("resumeCta")}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("restartCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
