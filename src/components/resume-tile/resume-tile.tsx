import { Skeleton } from "@/components/ui/skeleton/skeleton";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { CourseCardModel, TargetVideo } from "@/lib/course-shelf/course-shelf";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";
import { watchedFraction } from "@/lib/watch-progress/watch-progress";

import { Play } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import Image from "next/image";

/** What the tile knows: nothing yet, or the card model of the course to resume. */
export type ResumeReading = { status: "pending" } | { status: "read"; model: CourseCardModel };

/** Props for {@link ResumeTile}. */
export type ResumeTileProps = {
  reading: ResumeReading;
};

const MARK_KEY: Record<TargetVideo["kind"], "pickUp" | "startHere" | "courseComplete"> = {
  continue: "pickUp",
  start: "startHere",
  rewatch: "courseComplete",
};

const ACTION_KEY: Record<TargetVideo["kind"], "resume" | "start" | "watchAgain"> = {
  continue: "resume",
  start: "start",
  rewatch: "watchAgain",
};

const PLACEHOLDER_GLOW =
  "radial-gradient(90% 90% at 20% 10%, color-mix(in oklab, var(--glow) 22%, var(--background)), var(--background) 70%)";

const TILE =
  "relative isolate flex min-h-80 flex-col justify-end gap-2.5 overflow-hidden rounded-[22px] border border-border bg-background p-5 lg:min-h-[380px] lg:rounded-[26px] lg:p-8";

/**
 * My learning's way back in: the video to open next in the course the learner
 * watched last, as the course overview's artwork tile.
 *
 * @remarks
 * The mark reads **Pick up where you left off**, **Start here** or **Course
 * complete**, and the one action **Resume**, **Start** or **Watch again**, by
 * the target's kind. A video with a saved position shows a progress bar with
 * its elapsed and total time and how long ago the course was last watched.
 * Until the learner's state is read, the tile holds its shape with
 * placeholders that name no lesson.
 *
 * @example
 * ```tsx
 * <ResumeTile reading={{ status: "read", model }} />
 * ```
 */
export function ResumeTile({ reading }: ResumeTileProps) {
  const model = reading.status === "read" ? reading.model : null;
  const target = model?.target ?? null;
  if (!model || !target) return <PendingTile />;

  return (
    <section
      data-testid="resume-tile"
      data-status="read"
      className={TILE}
    >
      <TileArtwork poster={target.lesson.poster} />
      <ResumeCopy
        model={model}
        target={target}
      />
    </section>
  );
}

function PendingTile() {
  return (
    <section
      data-testid="resume-tile"
      data-status="pending"
      className={TILE}
      style={{ background: PLACEHOLDER_GLOW }}
    >
      <Skeleton className="h-3 w-56" />
      <Skeleton className="h-9 w-3/4 lg:h-11" />
      <Skeleton className="mt-1.5 h-13 w-44 rounded-[14px]" />
    </section>
  );
}

function TileArtwork({ poster }: { poster: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 -z-10"
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-cover"
        />
      ) : (
        <span
          className="absolute inset-0"
          style={{ background: PLACEHOLDER_GLOW }}
        />
      )}
      <span className="absolute inset-0 bg-linear-to-t from-background from-20% via-background/55 to-background/10" />
    </span>
  );
}

function ResumeCopy({ model, target }: { model: CourseCardModel; target: TargetVideo }) {
  const t = useTranslations("Components.ResumeTile");
  const { course } = model;

  return (
    <>
      <span className="absolute top-4 left-4 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-bold text-foreground backdrop-blur lg:top-5 lg:left-5">
        {t(MARK_KEY[target.kind])}
      </span>
      <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
        {t("position", {
          course: course.title,
          module: String(target.module.sequence).padStart(2, "0"),
          number: target.lessonNumber,
          total: model.targetVideoCount,
        })}
      </span>
      <h2 className="text-[1.875rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground lg:text-[2.875rem]">
        {target.lesson.title}
      </h2>
      {target.kind === "continue" && model.targetPositionSeconds !== null ? (
        <WatchProgress
          positionSeconds={model.targetPositionSeconds}
          durationSeconds={target.lesson.durationSeconds}
          watchedAt={model.watchedAt}
        />
      ) : null}
      <Link
        href={lessonPath(course, target.module, target.lesson) as never}
        className="mt-1.5 inline-flex min-h-13 items-center gap-2.5 self-start rounded-[14px] bg-primary px-5.5 text-base font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter,transform] after:absolute after:inset-0 after:content-[''] hover:-translate-y-px hover:brightness-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
      >
        <Play
          aria-hidden="true"
          className="size-4"
          fill="currentColor"
        />
        {t(ACTION_KEY[target.kind])}
      </Link>
    </>
  );
}

function WatchProgress({
  positionSeconds,
  durationSeconds,
  watchedAt,
}: {
  positionSeconds: number;
  durationSeconds: number;
  watchedAt: number | null;
}) {
  const t = useTranslations("Components.ResumeTile");
  const format = useFormatter();
  const now = useNow();

  return (
    <div
      data-testid="resume-tile-progress"
      className="flex max-w-md flex-col gap-1.5"
    >
      <span className="h-1 overflow-hidden rounded-full bg-foreground/20">
        <span
          className="block h-full rounded-full bg-gold"
          style={{ width: `${watchedFraction(positionSeconds, durationSeconds) * 100}%` }}
        />
      </span>
      <span className="flex justify-between gap-4 font-mono text-xs text-muted-foreground tabular-nums">
        <span>
          {formatMinutesSeconds(positionSeconds)} / {formatMinutesSeconds(durationSeconds)}
        </span>
        {watchedAt !== null ? (
          <span>{t("watched", { when: format.relativeTime(watchedAt, now) })}</span>
        ) : null}
      </span>
    </div>
  );
}
