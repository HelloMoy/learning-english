"use client";

import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { ProgressRing } from "@/components/progress-ring/progress-ring";
import type { Course } from "@/domain/entities/course/course";
import type { ModuleId } from "@/domain/entities/ids/ids";
import type { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import {
  useCourseWatchProgress,
  type WatchTally,
} from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/utils";

import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";

/** Where a lesson stands for the learner: finished, being watched, or still ahead. */
type ProgressCardState = "complete" | "current" | "upcoming";

/** The video the learner last watched, which the lead card continues. */
export type ContinuedLesson = {
  /** The module holding the video. */
  moduleId: ModuleId | string;
  /** The video's title, named on the lead card. */
  lessonTitle: string;
  /** Where Continue goes: the video itself. */
  lessonHref: string;
};

const EMPTY_TALLY: WatchTally = { completedCount: 0, lessonCount: 0 };

/**
 * A learner's progress through one course, one card per lesson (domain
 * `Module`).
 *
 * @remarks
 * Counts come from `useCourseWatchProgress`, the same rule the course overview
 * and the lesson outline use, so the surfaces never disagree.
 *
 * Every card opens its lesson's overview. When a video is continued, the card
 * of the lesson holding it leads the list at full width, names that video and
 * is the only card with Continue, which opens the video itself; the other
 * cards follow in sequence order. With nothing continued every card is in
 * sequence order and none offers Continue.
 *
 * Before hydration nothing is counted: the server cannot read `localStorage`,
 * so every ring reads 0% and every card reads as upcoming until the browser has
 * an answer. The lead card is known from props and is placed from the first
 * paint.
 *
 * @param courseSlug - The course's slug, for the lesson overview links
 * @param courseTitle - The course whose progress is listed
 * @param modules - Every module of the course, in any order
 * @param lessonRuntimes - Every lesson's progress slice for the course
 * @param continued - The video last watched in this course, or `null` when nothing is continued
 */
export function CourseProgressList({
  courseSlug,
  courseTitle,
  modules,
  lessonRuntimes,
  continued,
}: {
  courseSlug: string;
  courseTitle: string;
  modules: ReadonlyArray<Module>;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  continued: ContinuedLesson | null;
}) {
  const t = useTranslations("Components.CourseProgressList");
  const isHydrated = useIsHydrated();
  const progress = useCourseWatchProgress(lessonRuntimes);

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-3.5 lg:col-span-4">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="font-sans text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl">
          {courseTitle}
        </h2>
        <p className="text-base text-muted-foreground">
          {t("watched", {
            completed: isHydrated ? progress.completedCount : 0,
            total: progress.lessonCount,
          })}
        </p>
        <ProgressTrack fraction={isHydrated ? progress.completedFraction : 0} />
      </div>
      <ol
        aria-label={t("listLabel", { course: courseTitle })}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8"
      >
        {leadWithContinued(modules, continued).map((module) => {
          const watched = isHydrated
            ? (progress.byModuleId.get(module.id) ?? EMPTY_TALLY)
            : EMPTY_TALLY;
          const tally = { ...watched, lessonCount: countLessons(lessonRuntimes, module.id) };
          // The slug arrives from a parsed `Course`; the prop is widened only so
          // callers need not re-brand it.
          const overviewHref = moduleOverviewPath({ slug: courseSlug as Course["slug"] }, module);
          return module.id === continued?.moduleId ? (
            <LeadLessonCard
              key={module.id}
              module={module}
              overviewHref={overviewHref}
              tally={tally}
              continued={continued}
            />
          ) : (
            <LessonCard
              key={module.id}
              module={module}
              overviewHref={overviewHref}
              tally={tally}
            />
          );
        })}
      </ol>
    </section>
  );
}

/** Modules in sequence order, with the continued one moved to the front. */
function leadWithContinued(
  modules: ReadonlyArray<Module>,
  continued: ContinuedLesson | null,
): Module[] {
  const inSequence = [...modules].sort((a, b) => a.sequence - b.sequence);
  const isContinued = (module: Module) => module.id === continued?.moduleId;
  return [
    ...inSequence.filter(isContinued),
    ...inSequence.filter((module) => !isContinued(module)),
  ];
}

function countLessons(
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>,
  moduleId: string,
): number {
  return lessonRuntimes.filter((slice) => slice.moduleId === moduleId).length;
}

function completedShare({ completedCount, lessonCount }: WatchTally): number {
  return lessonCount > 0 ? completedCount / lessonCount : 0;
}

function cardState(tally: WatchTally): ProgressCardState {
  return tally.lessonCount > 0 && tally.completedCount === tally.lessonCount
    ? "complete"
    : "upcoming";
}

/** The lesson being continued: full width, its last video named, and Continue. */
function LeadLessonCard({
  module,
  overviewHref,
  tally,
  continued,
}: {
  module: Module;
  overviewHref: string;
  tally: WatchTally;
  continued: ContinuedLesson;
}) {
  const t = useTranslations("Components.CourseProgressList");

  return (
    <li
      data-state="current"
      className="group relative flex flex-col gap-5 rounded-[1.125rem] border border-gold/45 bg-[radial-gradient(90%_140%_at_0%_0%,color-mix(in_oklab,var(--glow)_18%,var(--card)),var(--card)_60%)] p-5 transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:border-gold/70 sm:col-span-2 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
    >
      <ModuleRing
        tally={tally}
        className="size-[4.5rem]"
        labelClassName="text-sm text-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-2.5">
          <ModuleOrdinal number={module.sequence} />
          <span className="shrink-0 rounded-md border border-gold/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
            {t("current")}
          </span>
        </span>
        <CardTitleLink
          href={overviewHref}
          title={module.title}
          className="text-2xl font-extrabold tracking-tight"
        />
        <p className="text-sm text-muted-foreground">
          <ModuleCount tally={tally} />
          {" · "}
          {t.rich("leftOffAt", {
            title: continued.lessonTitle,
            video: (chunks) => <span className="text-foreground">{chunks}</span>,
          })}
        </p>
      </div>
      <Link
        href={continued.lessonHref as never}
        className="relative z-10 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-[0.625rem] bg-primary px-[1.125rem] text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:self-auto"
      >
        <Play
          aria-hidden="true"
          className="size-3.5 fill-current"
        />
        {t("continue")}
      </Link>
    </li>
  );
}

function LessonCard({
  module,
  overviewHref,
  tally,
}: {
  module: Module;
  overviewHref: string;
  tally: WatchTally;
}) {
  return (
    <li
      data-state={cardState(tally)}
      className="group relative flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5 transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:border-gold/45"
    >
      <div className="flex items-center justify-between gap-3">
        <ModuleOrdinal number={module.sequence} />
        <ModuleRing
          tally={tally}
          labelClassName="text-foreground"
        />
      </div>
      <CardTitleLink
        href={overviewHref}
        title={module.title}
        className="text-lg leading-snug font-bold"
      />
      <div className="mt-auto flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
        <ModuleCount tally={tally} />
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-colors group-hover:text-gold"
        />
      </div>
    </li>
  );
}

/**
 * The card's title, as the link to the lesson overview. Its hit area is
 * stretched over the whole card, so the card opens the overview while Continue
 * stays a separate link rather than a link inside a link.
 */
function CardTitleLink({
  href,
  title,
  className,
}: {
  href: string;
  title: string;
  className: string;
}) {
  return (
    <Link
      href={href as never}
      data-testid="progress-card-title"
      className={cn(
        "text-foreground after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none",
        className,
      )}
    >
      {title}
    </Link>
  );
}

function ModuleOrdinal({ number }: { number: number }) {
  const t = useTranslations("Components.CourseProgressList");

  return <span className="text-xs font-bold text-gold">{t("moduleOrdinal", { number })}</span>;
}

function ModuleCount({ tally }: { tally: WatchTally }) {
  const t = useTranslations("Components.CourseProgressList");

  return (
    <span className="tabular-nums">
      {t("moduleCount", { completed: tally.completedCount, total: tally.lessonCount })}
    </span>
  );
}

function ModuleRing({
  tally,
  className,
  labelClassName,
}: {
  tally: WatchTally;
  className?: string;
  labelClassName: string;
}) {
  const t = useTranslations("Components.CourseProgressList");
  const share = completedShare(tally);

  return (
    <ProgressRing
      share={share}
      label={t("progressPercent", { percent: share })}
      className={className}
      labelClassName={labelClassName}
    />
  );
}

function ProgressTrack({ fraction }: { fraction: number }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-secondary">
      <span
        className="block h-full rounded-full bg-primary"
        style={{ width: `${Math.round(fraction * 100)}%` }}
      />
    </span>
  );
}
