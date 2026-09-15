import { ProgressRing } from "@/components/progress-ring/progress-ring";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { lessonPath, moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type {
  ModuleOverviewProgress,
  ModuleStatus,
} from "@/lib/course-overview-progress/course-overview-progress";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";
import Image from "next/image";

/**
 * What a lesson tile knows about progress: nothing yet (the server render and
 * the hydration pass), or this device's reading.
 */
export type LessonRingReading =
  { status: "pending" } | { status: "read"; progress: ModuleOverviewProgress };

/** Props for {@link LessonRingTile}. */
export type LessonRingTileProps = {
  course: Course;
  module: Module;
  summary: ModuleSummary;
  reading: LessonRingReading;
};

const STATUS_KEY: Record<
  ModuleStatus,
  "statusCompleted" | "statusInProgress" | "statusNotStarted"
> = {
  completed: "statusCompleted",
  "in-progress": "statusInProgress",
  "not-started": "statusNotStarted",
};

const STATUS_CHIP: Record<ModuleStatus, string> = {
  completed: "bg-gold text-primary-foreground",
  "in-progress": "bg-gold/15 text-gold ring-1 ring-gold/50",
  "not-started": "bg-foreground/5 text-muted-foreground",
};

const PLACEHOLDER_GLOW =
  "radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, var(--glow) 30%, var(--background)), var(--background) 72%)";

/**
 * One lesson (module) of the course overview: its artwork, ordinal, a progress
 * ring, a status and how much is left. The whole tile opens the lesson.
 *
 * @remarks
 * The tile never lists the lesson's videos — that is the module overview's job,
 * and the tile links there (straight to the video when the lesson holds one).
 *
 * On a phone the tile is a row led by its ring; from `lg` it is a card with an
 * artwork band the ring overlaps. The lesson holding the video the learner
 * continues with is edged in gold.
 *
 * Progress is read on the device, so before it is known the tile states only the
 * lesson's size and draws an empty ring: nothing a returning learner would see
 * contradicted a moment later.
 *
 * @example
 * ```tsx
 * <LessonRingTile course={course} module={module} summary={summary} reading={{ status: "pending" }} />
 * ```
 */
export function LessonRingTile({ course, module, summary, reading }: LessonRingTileProps) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const progress = reading.status === "read" ? reading.progress : null;
  const ordinal = String(module.sequence).padStart(2, "0");
  const poster = summary.lessons[0]?.poster;

  return (
    <Link
      href={tileHref(course, module, summary) as never}
      aria-label={t("openLessonTile", { number: module.sequence, title: module.title })}
      data-testid="lesson-ring-tile"
      data-status={progress?.status ?? "pending"}
      data-current={progress?.isCurrent ? "true" : "false"}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-[20px] border bg-card p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-3xl lg:p-0",
        progress?.isCurrent
          ? "border-gold/60 shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_30%,transparent),0_30px_80px_-30px_color-mix(in_oklab,var(--glow)_45%,transparent)]"
          : "border-border",
      )}
    >
      <TileArtwork
        poster={poster}
        ordinal={ordinal}
      />
      <span className="relative shrink-0 lg:hidden">
        <TileRing
          size={76}
          progress={progress}
        />
      </span>
      <span className="relative -mt-14 hidden justify-center lg:flex">
        <TileRing
          size={128}
          progress={progress}
        />
      </span>
      <span className="relative flex min-w-0 flex-1 flex-col gap-1.5 lg:items-center lg:gap-2 lg:px-4 lg:pt-3.5 lg:pb-5 lg:text-center">
        <span className="font-mono text-xs text-gold lg:hidden">{ordinal}</span>
        {progress ? (
          <span
            className={cn(
              "hidden rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap lg:inline-flex",
              STATUS_CHIP[progress.status],
            )}
          >
            {t(STATUS_KEY[progress.status])}
          </span>
        ) : null}
        <span className="text-lg leading-tight font-black text-foreground lg:min-h-11 lg:text-[1.1875rem]">
          {module.title}
        </span>
        <TileMeta
          summary={summary}
          progress={progress}
        />
      </span>
    </Link>
  );
}

function TileArtwork({ poster, ordinal }: { poster: string | undefined; ordinal: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        data-testid="lesson-ring-tile-phone-artwork"
        className="absolute inset-0 lg:hidden"
      >
        <PosterFill poster={poster} />
        {/* The row's text runs over the artwork, so the scrim darkens where the
            ring and title sit and lets the image show toward the right edge. */}
        <span
          data-testid="lesson-ring-tile-phone-scrim"
          className="absolute inset-0 bg-linear-to-r from-card from-15% via-card/75 via-55% to-card/10"
        />
      </span>
      <span
        aria-hidden="true"
        className="relative hidden h-[120px] overflow-hidden lg:block"
      >
        <PosterFill poster={poster} />
        <span className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
        <span className="absolute top-3 left-4 text-[2.75rem] leading-none font-black text-transparent [-webkit-text-stroke:1.5px_var(--gold)]">
          {ordinal}
        </span>
      </span>
    </>
  );
}

function PosterFill({ poster }: { poster: string | undefined }) {
  if (!poster) {
    return (
      <span
        className="absolute inset-0"
        style={{ background: PLACEHOLDER_GLOW }}
      />
    );
  }
  return (
    <Image
      src={poster}
      alt=""
      fill
      sizes="(min-width: 1024px) 240px, 100vw"
      className="object-cover opacity-40"
    />
  );
}

function TileRing({ size, progress }: { size: number; progress: ModuleOverviewProgress | null }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <ProgressRing
      size={size}
      glow={false}
      fraction={progress?.completedFraction ?? 0}
    >
      {progress ? (
        <span className={cn("font-black text-foreground", size > 100 ? "text-2xl" : "text-base")}>
          {t("percentComplete", { percent: progress.completedFraction })}
        </span>
      ) : null}
    </ProgressRing>
  );
}

function TileMeta({
  summary,
  progress,
}: {
  summary: ModuleSummary;
  progress: ModuleOverviewProgress | null;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();

  if (!progress) {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {t("courseMetaShort", {
          videos: t("videoCount", { count: summary.lessons.length }),
          duration: runtimeLabel(summary.totalDurationSeconds),
        })}
      </span>
    );
  }

  const remaining =
    progress.status === "completed"
      ? t("allWatchedShort")
      : t("timeLeft", { duration: runtimeLabel(progress.secondsLeft) });
  return (
    <span className="font-mono text-xs text-muted-foreground">
      {t("lessonTally", { completed: progress.completedCount, total: progress.lessonCount })}
      <span aria-hidden="true"> · </span>
      {remaining}
    </span>
  );
}

function tileHref(course: Course, module: Module, summary: ModuleSummary): string {
  const [onlyLesson] = summary.lessons;
  if (summary.lessons.length === 1 && onlyLesson) return lessonPath(course, module, onlyLesson);
  return moduleOverviewPath(course, module);
}
