"use client";

import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import {
  resolveContinueWatchingPanel,
  type ResolveContinueWatching,
} from "@/app/[locale]/resolve-continue-watching";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
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

/** How far into the lesson the learner is, as a whole percentage. */
type Progress = {
  percent: number;
  remaining: string;
  total: string;
};

/**
 * What the panel knows so far.
 *
 * The four states exist because "nothing stored" and "stored but not yet
 * resolved" are different facts, and collapsing them is what made the panel
 * appear out of nowhere and shove the ladder down. Only `resolving` reserves a
 * slot, and it is reached only after storage has answered that a record exists.
 */
type PanelState =
  | { status: "reading-storage" }
  | { status: "resolving" }
  | { status: "nothing-to-continue" }
  | { status: "resolved"; panel: ContinueWatchingPanel; lessonId: LessonId };

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
 * **Between those two, the slot is held open.** Storage answers in the same
 * tick; the server action does not, and on a slow connection the gap is
 * seconds. Rendering nothing across it meant the whole section — heading, card
 * and primary action — appeared out of nowhere and shoved the ladder down,
 * which is the worst thing to do to a learner who has just started reading it.
 * The reservation is gated on the record's **existence**, the cheap half of
 * the answer: it claims "there is something here, still resolving" and nothing
 * more. A learner with no record still sees exactly what they saw before —
 * nothing, and no gap where the panel would be.
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
  resolve = resolveContinueWatchingPanel,
  continueWatching,
  positions,
}: {
  resolve?: ResolveContinueWatching;
  continueWatching?: ContinueWatchingRepository;
  positions?: PlaybackPositionRepository;
}) {
  const t = useTranslations("Components.ContinueWatching");
  const locations = useContinueWatching(continueWatching);
  const [state, setState] = useState<PanelState>({ status: "reading-storage" });

  useEffect(() => {
    let isCurrent = true;
    void locations.get().then(async (location) => {
      if (!isCurrent) return;
      if (!location) {
        setState({ status: "nothing-to-continue" });
        return;
      }
      // The record exists — that much is now known, and it is the whole basis
      // for reserving the slot while the round-trip below runs.
      setState({ status: "resolving" });
      const resolved = await resolve(location);
      if (!isCurrent) return;
      setState(
        resolved
          ? { status: "resolved", panel: resolved, lessonId: location.lessonId }
          : { status: "nothing-to-continue" },
      );
    });
    return () => {
      isCurrent = false;
    };
  }, [locations, resolve]);

  if (state.status === "resolving") {
    return <ReservedSlot t={t} />;
  }

  if (state.status !== "resolved") {
    return null;
  }

  const { panel, lessonId } = state;

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
 * The panel's slot, held open while the server action resolves the record.
 *
 * @remarks
 * The shapes are the panel's own: the breadcrumb line, the lesson title, and
 * the resume action. It names nothing, because at this point nothing is known
 * beyond "a record exists" — which is exactly what a reserved slot claims.
 *
 * The heading is real rather than a shape. It is the section's own copy, it is
 * true the moment a record exists, and rendering it means the section does not
 * grow a heading later.
 */
function ReservedSlot({
  t,
}: {
  t: ReturnType<typeof useTranslations<"Components.ContinueWatching">>;
}) {
  return (
    <section
      data-testid="continue-watching-skeleton"
      className="flex flex-col gap-6"
    >
      <Eyebrow as="h2">{t("heading")}</Eyebrow>

      <div
        aria-hidden="true"
        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border p-7"
        style={{ background: PANEL_GLOW }}
      >
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-8 w-2/3 sm:h-9" />
        <Skeleton className="h-11 w-36 rounded-lg" />
      </div>
    </section>
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
