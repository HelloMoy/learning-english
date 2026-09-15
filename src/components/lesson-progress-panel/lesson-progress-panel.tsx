"use client";

import { ProgressRing } from "@/components/progress-ring/progress-ring";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type {
  ModuleLesson,
  ModuleSummary,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { useModuleProgress } from "@/hooks/use-module-progress/use-module-progress";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { lessonPath, moduleOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { ModuleProgress } from "@/lib/module-progress/module-progress";

import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type PanelProps = {
  course: Course;
  module: Module;
  summary: ModuleSummary;
};

const PRIMARY_ACTION =
  "inline-flex min-h-13 items-center justify-center gap-2.5 rounded-xl bg-primary px-8 text-base font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
const SECONDARY_ACTION =
  "inline-flex min-h-11 items-center gap-1.5 self-center rounded-sm sm:self-auto text-sm font-bold text-gold transition-colors hover:text-amber focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * The invitation under the course carousel: continue the selected module, or
 * start it, or watch it again.
 *
 * @remarks
 * The state comes from `useModuleProgress`, which reads this device's
 * completion marks and playback positions with the same rule every other
 * progress indicator uses:
 *
 * - **not started** — a segmented ring, "N videos ready", Start this lesson;
 * - **in progress** — a filled ring with the completed share, "Pick up
 *   <video>", time left, Continue and Open lesson;
 * - **completed** — a full ring, "All N videos watched", Watch again and Open
 *   lesson.
 *
 * The first two list the next videos as "Up next". Before hydration the server
 * cannot know any of this, so the panel renders only the module's title, its
 * meta line and Open lesson — nothing that a returning learner would see
 * contradicted a moment later.
 *
 * @example
 * ```tsx
 * <LessonProgressPanel course={course} module={module} summary={summary} />
 * ```
 */
export function LessonProgressPanel({ course, module, summary }: PanelProps) {
  const isHydrated = useIsHydrated();
  const progress = useModuleProgress(summary.lessons);
  const state = isHydrated ? progress.kind : "pending";

  return (
    <section
      data-testid="lesson-progress-panel"
      data-state={state}
      className="flex flex-col items-center gap-8 rounded-[22px] border border-border bg-[radial-gradient(60%_120%_at_10%_50%,color-mix(in_oklab,var(--glow)_14%,var(--card)),var(--card)_70%)] px-5 py-7 text-center sm:px-10 sm:py-9 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:items-center lg:gap-11 lg:text-left"
    >
      {isHydrated ? (
        <PanelBody
          course={course}
          module={module}
          summary={summary}
          progress={progress}
        />
      ) : (
        <PendingBody
          course={course}
          module={module}
          summary={summary}
        />
      )}
    </section>
  );
}

function PanelBody({ progress, ...props }: PanelProps & { progress: ModuleProgress }) {
  switch (progress.kind) {
    case "not-started":
      return (
        <NotStartedBody
          {...props}
          progress={progress}
        />
      );
    case "in-progress":
      return (
        <InProgressBody
          {...props}
          progress={progress}
        />
      );
    case "completed":
      return (
        <CompletedBody
          {...props}
          progress={progress}
        />
      );
    case "empty":
      return <PendingBody {...props} />;
  }
}

function PendingBody({ course, module, summary }: PanelProps) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <>
      <ProgressRing
        size={220}
        fraction={0}
      />
      <PanelCopy
        title={module.title}
        meta={<ModuleMeta summary={summary} />}
      >
        <OpenLessonLink
          course={course}
          module={module}
          label={t("openLesson")}
        />
      </PanelCopy>
    </>
  );
}

function NotStartedBody({
  course,
  module,
  summary,
  progress,
}: PanelProps & { progress: Extract<ModuleProgress, { kind: "not-started" }> }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();
  return (
    <>
      <ProgressRing
        size={220}
        segments={progress.lessonCount}
      >
        <RingFigure
          figure={progress.lessonCount}
          caption={t("videosReady", { count: progress.lessonCount })}
        />
      </ProgressRing>
      <PanelCopy
        eyebrow={t("startThisLesson")}
        title={module.title}
        meta={t("beginsWith", {
          duration: runtimeLabel(summary.totalDurationSeconds),
          title: progress.target.title,
        })}
      >
        <Link
          href={lessonPath(course, module, progress.target) as never}
          className={PRIMARY_ACTION}
        >
          <Play
            aria-hidden="true"
            className="size-4"
            fill="currentColor"
          />
          {t("startThisLesson")}
        </Link>
      </PanelCopy>
      <UpNext lessons={progress.upNext} />
    </>
  );
}

function InProgressBody({
  course,
  module,
  progress,
}: PanelProps & { progress: Extract<ModuleProgress, { kind: "in-progress" }> }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();
  const completedFraction = progress.completedCount / progress.lessonCount;
  return (
    <>
      <ProgressRing
        size={220}
        fraction={completedFraction}
      >
        <RingFigure
          figure={t("percentComplete", { percent: completedFraction })}
          caption={t("completedOfTotal", {
            completed: progress.completedCount,
            total: progress.lessonCount,
          })}
        />
      </ProgressRing>
      <PanelCopy
        eyebrow={t("keepGoing")}
        title={t("pickUp", { title: progress.target.title })}
        meta={
          <MetaParts
            parts={[
              t("videoOfTotal", { number: progress.targetNumber, total: progress.lessonCount }),
              t("timeLeft", { duration: runtimeLabel(progress.secondsLeftInTarget) }),
              t("timeLeftInModule", {
                duration: runtimeLabel(progress.secondsLeftInModule),
                title: module.title,
              }),
            ]}
          />
        }
      >
        <Link
          href={lessonPath(course, module, progress.target) as never}
          className={PRIMARY_ACTION}
        >
          <Play
            aria-hidden="true"
            className="size-4"
            fill="currentColor"
          />
          {t("continueWatching")}
        </Link>
        <OpenLessonLink
          course={course}
          module={module}
          label={t("openLesson")}
        />
      </PanelCopy>
      <UpNext lessons={progress.upNext} />
    </>
  );
}

function CompletedBody({
  course,
  module,
  progress,
}: PanelProps & { progress: Extract<ModuleProgress, { kind: "completed" }> }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <>
      <ProgressRing
        size={220}
        fraction={1}
      >
        <RingFigure
          figure={t("percentComplete", { percent: 1 })}
          caption={t("completedOfTotal", {
            completed: progress.lessonCount,
            total: progress.lessonCount,
          })}
        />
      </ProgressRing>
      <PanelCopy
        eyebrow={t("completedEyebrow")}
        title={module.title}
        meta={t("allWatched", { count: progress.lessonCount })}
      >
        <Link
          href={lessonPath(course, module, progress.first) as never}
          className={PRIMARY_ACTION}
        >
          <Play
            aria-hidden="true"
            className="size-4"
            fill="currentColor"
          />
          {t("watchAgain")}
        </Link>
        <OpenLessonLink
          course={course}
          module={module}
          label={t("openLesson")}
        />
      </PanelCopy>
    </>
  );
}

function PanelCopy({
  eyebrow,
  title,
  meta,
  children,
}: {
  eyebrow?: string;
  title: string;
  meta: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3.5 lg:items-start">
      {eyebrow ? (
        <span className="text-xs font-bold tracking-[0.32em] text-gold uppercase">{eyebrow}</span>
      ) : null}
      <h2 className="text-[2.125rem] leading-[1.05] font-black tracking-tight text-balance text-foreground lg:text-[2.75rem]">
        {title}
      </h2>
      <p className="text-[0.9375rem] text-muted-foreground">{meta}</p>
      <div className="flex w-full flex-col items-stretch gap-3 pt-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
        {children}
      </div>
    </div>
  );
}

function RingFigure({ figure, caption }: { figure: ReactNode; caption: string }) {
  return (
    <>
      <span className="text-[2.875rem] leading-none font-black tracking-tight text-foreground">
        {figure}
      </span>
      <span className="pt-1 text-xs text-muted-foreground">{caption}</span>
    </>
  );
}

function MetaParts({ parts }: { parts: ReadonlyArray<string> }) {
  return parts.map((part, index) => (
    <span key={part}>
      {index > 0 ? <span aria-hidden="true"> · </span> : null}
      {part}
    </span>
  ));
}

function ModuleMeta({ summary }: { summary: ModuleSummary }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();
  return t("courseMetaShort", {
    videos: t("videoCount", { count: summary.lessonCount }),
    duration: runtimeLabel(summary.totalDurationSeconds),
  });
}

function OpenLessonLink({
  course,
  module,
  label,
}: Omit<PanelProps, "summary"> & { label: string }) {
  return (
    <Link
      href={moduleOverviewPath(course, module) as never}
      className={SECONDARY_ACTION}
    >
      {label}
      <ArrowRight
        aria-hidden="true"
        className="size-4"
      />
    </Link>
  );
}

function UpNext({ lessons }: { lessons: ReadonlyArray<ModuleLesson> }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const runtimeLabel = useRuntimeLabel();
  if (lessons.length === 0) return <span className="hidden lg:block" />;
  return (
    <div className="flex w-full flex-col gap-3 border-t border-border pt-5 text-left lg:border-t-0 lg:pt-0">
      <span
        id="lesson-progress-up-next"
        className="text-[0.6875rem] font-bold tracking-[0.3em] text-muted-foreground uppercase"
      >
        {t("upNext")}
      </span>
      <ol
        aria-labelledby="lesson-progress-up-next"
        className="flex flex-col gap-3"
      >
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="flex h-[50px] w-[88px] items-center justify-center rounded-md bg-[radial-gradient(120%_120%_at_30%_12%,color-mix(in_oklab,var(--glow)_22%,var(--card)),var(--card)_72%)] text-[0.8125rem] font-extrabold text-gold"
            >
              {String(lesson.sequence).padStart(2, "0")}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{lesson.title}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {runtimeLabel(lesson.durationSeconds)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
