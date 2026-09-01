"use client";

import { findContinueWatchingAction, type ContinueWatchingPanel } from "@/app/[locale]/actions";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { LessonId } from "@/domain/entities/ids/ids";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { useContinueWatching } from "@/hooks/use-continue-watching/use-continue-watching";
import { usePlaybackPosition } from "@/hooks/use-playback-position/use-playback-position";
import { Link } from "@/i18n/navigation";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** The card's own atmosphere, matching `ModuleShowcaseCard`'s glow. */
const PANEL_GLOW =
  "radial-gradient(90% 160% at 4% 0%, color-mix(in oklab, var(--glow) 34%, var(--background)), var(--background) 68%)";

/**
 * Calls the Server Action and unwraps its envelope.
 *
 * `next-safe-action` answers with `data`, `validationErrors` or
 * `serverError`, and the panel's answer to all three failures is the same:
 * render nothing. Collapsing them here keeps that shape out of the component
 * and lets a test inject a plain function.
 */
const resolveThroughAction = async (
  location: ContinueWatchingLocation,
): Promise<ContinueWatchingPanel | null> => {
  const result = await findContinueWatchingAction(location);
  return result?.data ?? null;
};

/** How far into the lesson the learner is, as a whole percentage. */
type Progress = {
  percent: number;
  remaining: string;
  total: string;
};

/**
 * The home's "Continue watching" panel: the lesson the learner opened last,
 * with how far into it they got and one action to go back to it.
 *
 * @remarks
 * Three sources meet here, and none of them duplicates another. The
 * `localStorage` record says *where* the learner was — a course slug, a
 * module slug and a lesson id. The server action turns that into the titles
 * and the href, so a retitled lesson shows its new name and nothing goes
 * stale in storage. The existing playback store says *how far in* they got,
 * keyed by the same lesson id the record names.
 *
 * The panel renders nothing at all when there is nothing to continue: no
 * record, a record that no longer resolves, or a first paint before storage
 * can be read. That silence is deliberate — a learner who has watched
 * nothing has done nothing wrong, and the ladder below reaches every course
 * without this panel's help.
 *
 * The progress indicator appears only for a video lesson with a saved
 * position. A reading lesson has nothing to measure, and drawing a bar at
 * zero would claim the learner had started something they had not.
 *
 * @param resolve - Overrides the resolver; defaults to the Server Action.
 *                  Tests inject a plain function here
 * @param continueWatching - Overrides the location store; tests inject a fake
 * @param positions - Overrides the playback store; tests inject a fake
 */
export function ContinueWatching({
  resolve = resolveThroughAction,
  continueWatching,
  positions,
}: {
  resolve?: (location: ContinueWatchingLocation) => Promise<ContinueWatchingPanel | null>;
  continueWatching?: ContinueWatchingRepository;
  positions?: PlaybackPositionRepository;
}) {
  const t = useTranslations("Components.ContinueWatching");
  const locations = useContinueWatching(continueWatching);
  const [panel, setPanel] = useState<ContinueWatchingPanel | null>(null);
  const [lessonId, setLessonId] = useState<LessonId | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void locations.get().then(async (location) => {
      if (!location || !isCurrent) {
        return;
      }
      const resolved = await resolve(location);
      if (isCurrent) {
        setPanel(resolved);
        setLessonId(resolved ? location.lessonId : null);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [locations, resolve]);

  if (!panel || !lessonId) {
    return null;
  }

  return (
    <Panel
      panel={panel}
      lessonId={lessonId}
      positions={positions}
      t={t}
    />
  );
}

/**
 * The resolved panel.
 *
 * Split out so `usePlaybackPosition` is only ever called with a real lesson
 * id: the hook keys its adapter on that id, and a `null` placeholder would
 * mean either a conditional hook call or a lookup for a lesson that does not
 * exist.
 */
function Panel({
  panel,
  lessonId,
  positions,
  t,
}: {
  panel: ContinueWatchingPanel;
  lessonId: LessonId;
  positions?: PlaybackPositionRepository;
  t: ReturnType<typeof useTranslations<"Components.ContinueWatching">>;
}) {
  const playback = usePlaybackPosition(lessonId, positions);
  const [progress, setProgress] = useState<Progress | null>(null);
  const { durationSeconds } = panel;

  useEffect(() => {
    let isCurrent = true;
    void playback.get().then((seconds) => {
      if (isCurrent) {
        setProgress(toProgress(seconds, durationSeconds));
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [playback, durationSeconds]);

  return (
    <section
      data-testid="continue-watching"
      aria-labelledby="continue-watching-heading"
      className="flex flex-col gap-6"
    >
      <Eyebrow
        as="h2"
        className="scroll-mt-24"
      >
        {t("heading")}
      </Eyebrow>

      <div
        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border p-7"
        style={{ background: PANEL_GLOW }}
      >
        <p
          data-testid="continue-watching-breadcrumb"
          className="truncate text-xs text-muted-foreground"
        >
          {t("breadcrumb", { course: panel.courseTitle, module: panel.moduleTitle })}
        </p>

        <h3
          id="continue-watching-heading"
          className="font-sans text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
        >
          {panel.lessonTitle}
        </h3>

        {progress ? (
          <div className="flex max-w-md flex-col gap-2">
            <div
              data-testid="continue-watching-progress"
              role="progressbar"
              aria-label={t("progressLabel")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
              className="h-1 overflow-hidden rounded-full bg-foreground/10"
            >
              <span
                className="block h-full rounded-full bg-gold"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p
              data-testid="continue-watching-remaining"
              className="text-xs text-muted-foreground tabular-nums"
            >
              {t("remaining", { remaining: progress.remaining, total: progress.total })}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={panel.lessonHref as never}
            data-testid="continue-watching-resume"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Play
              className="size-4"
              fill="currentColor"
            />
            {t("resume")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Turn a saved position and a lesson duration into what the bar renders, or
 * `null` when there is nothing honest to show — no saved position, or a
 * lesson with no duration to measure against.
 *
 * The percentage is clamped: a position saved at the very end of a lesson can
 * exceed its stored `durationSeconds` by a fraction of a second, and a bar
 * wider than its track is a visible bug.
 */
function toProgress(seconds: number | null, durationSeconds: number | null): Progress | null {
  if (seconds === null || durationSeconds === null || durationSeconds <= 0) {
    return null;
  }
  const watched = Math.min(Math.max(seconds, 0), durationSeconds);
  return {
    percent: Math.round((watched / durationSeconds) * 100),
    remaining: formatMinutesSeconds(durationSeconds - watched),
    total: formatMinutesSeconds(durationSeconds),
  };
}
