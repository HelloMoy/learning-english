import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { Course } from "@/domain/entities/course/course";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { ContinueTarget } from "@/lib/course-overview-progress/course-overview-progress";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** A continue target that names a video. */
export type ContinueVideo = Exclude<ContinueTarget, { kind: "none" }>;

/**
 * What the continue tile knows: nothing yet, or the video to open with the
 * number of videos in its lesson.
 */
export type ContinueReading =
  { status: "pending" } | { status: "read"; target: ContinueVideo; videoCount: number };

/** Props for {@link ContinueTile}. */
export type ContinueTileProps = {
  course: Course;
  reading: ContinueReading;
};

const ACTION_KEY: Record<
  ContinueVideo["kind"],
  "startCourse" | "continueWhereLeftOff" | "watchAgain"
> = {
  start: "startCourse",
  continue: "continueWhereLeftOff",
  rewatch: "watchAgain",
};

const PLACEHOLDER_GLOW =
  "radial-gradient(90% 90% at 20% 10%, color-mix(in oklab, var(--glow) 22%, var(--background)), var(--background) 70%)";

const TILE =
  "relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-[22px] border border-border bg-background lg:min-h-[380px] lg:rounded-[26px]";

/**
 * The course overview's one way in: the video the learner continues with, as a
 * large artwork tile with its position, title and a single action.
 *
 * @remarks
 * The action reads **Start course**, **Continue where you left off** or **Watch
 * again**, decided upstream by `courseOverviewProgress`. Its hit area stretches
 * over the whole tile without adding a second link.
 *
 * Until progress has been read the tile shows placeholders of its text and
 * action, so a returning learner never sees Start course swap to Continue.
 *
 * @example
 * ```tsx
 * <ContinueTile course={course} reading={{ status: "read", target, videoCount: 17 }} />
 * ```
 */
export function ContinueTile({ course, reading }: ContinueTileProps) {
  if (reading.status === "pending") return <PendingTile />;

  const { target, videoCount } = reading;
  return (
    <section
      data-testid="continue-tile"
      data-status="read"
      className={TILE}
    >
      <TileArtwork poster={target.lesson.poster} />
      <TileCopy
        course={course}
        target={target}
        videoCount={videoCount}
      />
    </section>
  );
}

function PendingTile() {
  return (
    <section
      data-testid="continue-tile"
      data-status="pending"
      className={TILE}
      style={{ background: PLACEHOLDER_GLOW }}
    >
      <div className="flex flex-col gap-3 p-5 lg:p-8">
        <Skeleton
          data-testid="continue-tile-placeholder"
          className="h-3 w-48"
        />
        <Skeleton
          data-testid="continue-tile-placeholder"
          className="h-9 w-3/4 lg:h-11"
        />
        <Skeleton
          data-testid="continue-tile-placeholder"
          className="mt-1.5 h-13 w-64 rounded-[14px]"
        />
      </div>
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

function TileCopy({
  course,
  target,
  videoCount,
}: {
  course: Course;
  target: ContinueVideo;
  videoCount: number;
}) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <div className="flex flex-col gap-2.5 p-5 lg:p-8">
      <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
        {t("videoPosition", {
          module: String(target.module.sequence).padStart(2, "0"),
          number: target.lessonNumber,
          total: videoCount,
        })}
      </span>
      <h2 className="text-[1.875rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground lg:text-[2.875rem]">
        {target.lesson.title}
      </h2>
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
    </div>
  );
}
