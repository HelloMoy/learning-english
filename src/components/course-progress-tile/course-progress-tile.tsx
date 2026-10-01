import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import { ProgressRing } from "@/components/progress-ring/progress-ring";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { Course } from "@/domain/entities/course/course";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { Link } from "@/i18n/navigation";
import type { ProgressTally } from "@/lib/course-overview-progress/course-overview-progress";
import type { PrizeId } from "@/lib/module-prizes/module-prizes";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

/** What the course tile knows about progress: nothing yet, or this device's reading. */
export type CourseProgressReading =
  { status: "pending" } | { status: "read"; tally: ProgressTally };

/**
 * The veil behind each prize in the row. The toys are small and sit over the
 * card, so without it the silhouettes blur into the surface behind them.
 *
 * @remarks
 * Deliberately the same gradient the lesson tile draws behind its own prize,
 * duplicated rather than shared — the same way `PLACEHOLDER_GLOW` is repeated
 * across the tiles that use it.
 */
const PRIZE_SCRIM =
  "radial-gradient(closest-side, color-mix(in oklab, var(--background) 82%, transparent), transparent)";

/** One of the course's prizes, and whether the learner has claimed it. */
export type CoursePrize = { prize: PrizeId; isClaimed: boolean };

/** Where the tile leads, and the words its closing link reads. */
export type CourseTileLink = {
  /** A locale-less app path, such as `/courses/basic-course/about`. */
  href: string;
  /** The closing link's text, already translated by the caller. */
  label: string;
};

/** Props for {@link CourseProgressTile}. */
export type CourseProgressTileProps = {
  course: Course;
  reading: CourseProgressReading;
  /** The prizes of the course's lessons that hold videos, in lesson order. */
  prizes?: ReadonlyArray<CoursePrize>;
  /**
   * The level of the course title's heading. `1` on the course overview, where
   * the title is the page heading; `2` where the page has its own.
   */
  headingLevel?: 1 | 2;
  /**
   * Where the tile leads; when given, the tile ends with a link reading its
   * label, and the course title links there too.
   */
  link?: CourseTileLink;
};

/**
 * The course overview's progress tile: the course title as a heading, a large
 * ring filled to the watched share, and how much is left in videos and time.
 *
 * @remarks
 * On a phone the ring leads a row; from `lg` the tile is a centred column. The
 * title always renders — on the server too — while the ring stays empty and the
 * figures stay hidden until this device's progress has been read.
 *
 * Given a `link`, the tile ends with it and the title leads to the same page.
 * The title's link stays out of the tab order, so keyboard users meet one stop.
 * The board links to the course page (**View course details**); My learning
 * reuses the tile beside its resume hero, with a level-two title and a **View
 * course** link to the overview.
 *
 * @example
 * ```tsx
 * <CourseProgressTile
 *   course={course}
 *   reading={{ status: "read", tally }}
 *   link={{ href: courseDetailPath(course), label: t("viewCourseDetails") }}
 * />
 * ```
 */
export function CourseProgressTile({
  course,
  reading,
  prizes = [],
  headingLevel = 1,
  link,
}: CourseProgressTileProps) {
  const tally = reading.status === "read" ? reading.tally : null;
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section
      data-testid="course-progress-tile"
      data-status={reading.status}
      className="flex items-center gap-4 rounded-[22px] border border-border bg-card p-4 lg:flex-col lg:justify-center lg:gap-4 lg:rounded-[26px] lg:p-6 lg:text-center"
    >
      <span className="lg:hidden">
        <CourseRing
          size={96}
          tally={tally}
        />
      </span>
      <span className="hidden lg:order-2 lg:block">
        <CourseRing
          size={190}
          tally={tally}
        />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5 lg:contents">
        <Heading className="font-sans text-[1.625rem] leading-none font-black tracking-[-0.03em] text-balance text-foreground lg:order-1 lg:text-3xl">
          {link ? <TitleLink href={link.href}>{course.title}</TitleLink> : course.title}
        </Heading>
        <span className="lg:order-3">
          <CourseFigures tally={tally} />
        </span>
        {/* The claims are read on the device too, so before the reading arrives
            "0 claimed" would assert something the page cannot justify. */}
        {tally && prizes.length > 0 ? (
          <span className="lg:order-4">
            <CoursePrizes prizes={prizes} />
          </span>
        ) : null}
        {link ? (
          <span className="lg:order-5">
            <ClosingLink link={link} />
          </span>
        ) : null}
      </div>
    </section>
  );
}

function TitleLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href as never}
      tabIndex={-1}
      className="decoration-gold/60 underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

function ClosingLink({ link }: { link: CourseTileLink }) {
  return (
    <Link
      href={link.href as never}
      className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-bold text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {link.label}
      <ArrowRight
        aria-hidden="true"
        className="size-4"
      />
    </Link>
  );
}

function CoursePrizes({ prizes }: { prizes: ReadonlyArray<CoursePrize> }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const claimed = prizes.filter((entry) => entry.isClaimed).length;

  return (
    <span className="mt-3 flex flex-col items-start gap-2 border-t border-border pt-3 lg:items-center">
      <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
        {t("prizesClaimed", { claimed, total: prizes.length })}
      </span>
      <span
        aria-hidden="true"
        className="flex flex-wrap gap-1.5 lg:justify-center"
      >
        {prizes.map((entry, index) => (
          <span
            key={`${entry.prize}-${index}`}
            data-testid="course-progress-tile-prize"
            style={{ background: PRIZE_SCRIM }}
            className="inline-flex rounded-full p-1"
          >
            <PrizeIcon
              prize={entry.prize}
              locked={!entry.isClaimed}
              size={30}
            />
          </span>
        ))}
      </span>
    </span>
  );
}

function CourseRing({ size, tally }: { size: number; tally: ProgressTally | null }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <ProgressRing
      size={size}
      fraction={tally?.completedFraction ?? 0}
    >
      {tally ? (
        <span className={size > 100 ? "text-4xl font-black" : "text-xl font-black"}>
          {t("percentComplete", { percent: tally.completedFraction })}
        </span>
      ) : null}
    </ProgressRing>
  );
}

function CourseFigures({ tally }: { tally: ProgressTally | null }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();

  if (!tally) return <Skeleton className="h-3.5 w-44" />;

  const remaining =
    tally.completedCount === tally.lessonCount
      ? t("allWatchedShort")
      : t("timeLeft", { duration: runtimeLabel(tally.secondsLeft) });
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums lg:text-[0.8125rem]">
      {t("completedOfTotal", { completed: tally.completedCount, total: tally.lessonCount })}
      <span aria-hidden="true"> · </span>
      {remaining}
    </span>
  );
}
