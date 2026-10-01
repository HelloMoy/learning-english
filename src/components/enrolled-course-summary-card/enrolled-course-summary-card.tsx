import { ProgressRing } from "@/components/progress-ring/progress-ring";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseDetailPath, courseOverviewPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { CourseCardModel, TargetVideo } from "@/lib/course-shelf/course-shelf";
import { cn } from "@/lib/utils/utils";
import { watchedFraction } from "@/lib/watch-progress/watch-progress";

import { ChartNoAxesColumn, Info, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

const ACTION_KEY: Record<TargetVideo["kind"], "start" | "continue" | "watchAgain"> = {
  start: "start",
  continue: "continue",
  rewatch: "watchAgain",
};

/** Props for {@link EnrolledCourseSummaryCard}. */
export type EnrolledCourseSummaryCardProps = {
  model: CourseCardModel;
  /** The course My learning leads with; its card wears the gold border. */
  isCurrent: boolean;
};

/**
 * One enrolled course on My learning's Your courses: its share watched, and the
 * video it continues with.
 *
 * @remarks
 * Each course keeps its own place (capability `course-enrollment`), so every
 * card names its own next video. Its one gold action reads **Start**,
 * **Continue** or **Watch again** by the target's kind, as the resume hero
 * does. The card closes with a split bar: **Progress** opens the course's
 * progress board and **Details** its course page (`/courses/<slug>/about`). The
 * ring and title lead to the board too, kept out of the tab order so keyboard
 * users meet **Progress** once. The card of the course the page leads with is
 * marked current.
 *
 * @example
 * ```tsx
 * <EnrolledCourseSummaryCard model={courseCardModel(shelfCourse, learner)} isCurrent />
 * ```
 */
export function EnrolledCourseSummaryCard({ model, isCurrent }: EnrolledCourseSummaryCardProps) {
  const { target } = model;

  return (
    <article
      data-testid="enrolled-course-summary-card"
      data-current={isCurrent}
      className={cn(
        "flex flex-col gap-4 overflow-hidden rounded-[22px] border bg-card p-4.5",
        isCurrent ? "border-gold/60" : "border-border",
      )}
    >
      <CardHeader model={model} />
      {target ? (
        <NextUpRow
          model={model}
          target={target}
        />
      ) : null}
      {target ? (
        <WatchAction
          model={model}
          target={target}
        />
      ) : null}
      <CourseLinks course={model.course} />
    </article>
  );
}

// The ring and title repeat the Progress link for the pointer, so they stay
// out of the tab order.
function CardHeader({ model }: { model: CourseCardModel }) {
  const t = useTranslations("Components.EnrolledCourseSummaryCard");
  const { course, tally } = model;

  return (
    <Link
      href={courseOverviewPath(course) as never}
      tabIndex={-1}
      className="group/header grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3.5"
    >
      <ProgressRing
        size={56}
        fraction={tally.completedFraction}
      >
        <span className="text-xs font-black">
          {t("percent", { percent: tally.completedFraction })}
        </span>
      </ProgressRing>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-lg leading-tight font-black tracking-[-0.02em] text-foreground decoration-gold/60 underline-offset-4 group-hover/header:underline">
          {course.title}
        </h3>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t("progress", { completed: tally.completedCount, total: tally.lessonCount })}
        </span>
      </div>
    </Link>
  );
}

function WatchAction({ model, target }: { model: CourseCardModel; target: TargetVideo }) {
  const t = useTranslations("Components.EnrolledCourseSummaryCard");

  return (
    <Link
      href={lessonPath(model.course, target.module, target.lesson) as never}
      className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-primary px-4 text-sm font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
    >
      <Play
        aria-hidden="true"
        className="size-4"
        fill="currentColor"
      />
      {t(ACTION_KEY[target.kind])}
    </Link>
  );
}

// The bar bleeds to the card's edges, so it undoes the card's padding.
function CourseLinks({ course }: { course: CourseCardModel["course"] }) {
  const t = useTranslations("Components.EnrolledCourseSummaryCard");

  return (
    <div className="-mx-4.5 -mb-4.5 grid grid-cols-2 divide-x divide-border border-t border-border">
      <BarLink href={courseOverviewPath(course)}>
        <ChartNoAxesColumn
          aria-hidden="true"
          className="size-4"
        />
        {t("viewProgress")}
      </BarLink>
      <BarLink href={courseDetailPath(course)}>
        <Info
          aria-hidden="true"
          className="size-4"
        />
        {t("viewDetails")}
      </BarLink>
    </div>
  );
}

function BarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as never}
      className="inline-flex min-h-12 items-center justify-center gap-2 text-[0.8125rem] font-extrabold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-gold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
    >
      {children}
    </Link>
  );
}

function NextUpRow({ model, target }: { model: CourseCardModel; target: TargetVideo }) {
  const t = useTranslations("Components.EnrolledCourseSummaryCard");
  const runtimeLabel = useRuntimeLabel();
  const watched = watchedFraction(model.targetPositionSeconds, target.lesson.durationSeconds);

  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3.5 rounded-[14px] bg-secondary/60 p-2.5">
      <span
        aria-hidden="true"
        className="relative aspect-video overflow-hidden rounded-lg bg-secondary"
      >
        {target.lesson.poster ? (
          <Image
            src={target.lesson.poster}
            alt=""
            fill
            sizes="104px"
            className="object-cover"
          />
        ) : null}
        {watched > 0 ? (
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
            <span
              className="block h-full bg-gold"
              style={{ width: `${watched * 100}%` }}
            />
          </span>
        ) : null}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[0.625rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {t(model.isCompleted ? "startOver" : "nextUp")}
        </span>
        <span className="truncate text-[0.9375rem] font-extrabold text-foreground">
          {target.lesson.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("position", {
            module: target.module.sequence,
            moduleTitle: target.module.title,
            number: target.lessonNumber,
            total: model.targetVideoCount,
            duration: runtimeLabel(target.lesson.durationSeconds),
          })}
        </span>
      </div>
    </div>
  );
}
