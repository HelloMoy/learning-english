"use client";

import { ProgressRing } from "@/components/progress-ring/progress-ring";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseDetailPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { ProgressTally } from "@/lib/course-overview-progress/course-overview-progress";
import type { CourseCardModel } from "@/lib/course-shelf/course-shelf";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** Props for {@link NextUpBar}. */
export type NextUpBarProps = {
  /** The course to start with, read as if joined: its target is the first video. */
  model: CourseCardModel;
};

const FOCUS_RING = "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * A slim "next up" bar, like a mini player, that tells a learner enrolled in
 * nothing where to begin: the recommended course's first video, where it
 * sits, and **Start course**.
 *
 * @remarks
 * Available courses renders it above its heading only while the learner has
 * no enrollment, so it leaves the moment they join any course. **Start
 * course** opens the first video, which enrolls them (`course-enrollment`);
 * **View course** opens the course page.
 *
 * On a phone the thumbnail and copy share a row and the actions take the full
 * width beneath; from `md` up everything sits on one line with a progress ring.
 * Renders nothing for a course with no video.
 *
 * @example
 * ```tsx
 * {shelf.recommended ? <NextUpBar model={shelf.recommended} /> : null}
 * ```
 */
export function NextUpBar({ model }: NextUpBarProps) {
  const t = useTranslations("Components.NextUpBar");
  const { course, target, tally } = model;
  if (!target) return null;

  return (
    <section
      data-testid="next-up-bar"
      className="relative isolate grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3.5 overflow-hidden rounded-[18px] border border-border bg-card p-3 md:grid-cols-[8rem_minmax(0,1fr)_auto_auto] md:gap-5 md:py-3.5 md:pr-4 md:pl-3.5"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_0%_50%,color-mix(in_oklab,var(--glow)_18%,transparent),transparent_70%)]"
      />
      <Thumbnail poster={target.lesson.poster} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="line-clamp-2 text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase md:truncate">
          {t("eyebrow", { course: course.title })}
        </span>
        <span className="truncate text-base font-extrabold text-foreground">
          {target.lesson.title}
        </span>
        <Position
          moduleNumber={target.module.sequence}
          tally={tally}
        />
      </div>
      <span className="hidden md:block">
        <ProgressRing
          size={48}
          fraction={tally.completedFraction}
          glow={false}
        >
          <span className="text-[0.6875rem] font-black tabular-nums">
            {t("percent", { percent: tally.completedFraction })}
          </span>
        </ProgressRing>
      </span>
      <div className="col-span-full flex gap-2 md:col-span-1">
        <Link
          href={lessonPath(course, target.module, target.lesson) as never}
          className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[12px] bg-primary px-5 text-[0.9375rem] font-extrabold whitespace-nowrap text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter] hover:brightness-105 md:flex-none ${FOCUS_RING}`}
        >
          <Play
            aria-hidden="true"
            className="size-4"
            fill="currentColor"
          />
          {t("startCourse")}
        </Link>
        <Link
          href={courseDetailPath(course) as never}
          className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-[12px] border border-border bg-card px-5 text-[0.9375rem] font-bold whitespace-nowrap text-foreground transition-colors hover:bg-secondary md:flex-none ${FOCUS_RING}`}
        >
          {t("viewCourse")}
        </Link>
      </div>
    </section>
  );
}

function Thumbnail({ poster }: { poster: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-secondary"
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="128px"
          className="object-cover"
        />
      ) : null}
    </span>
  );
}

function Position({ moduleNumber, tally }: { moduleNumber: number; tally: ProgressTally }) {
  const t = useTranslations("Components.NextUpBar");
  const runtimeLabel = useRuntimeLabel();

  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums md:truncate">
      {t("position", {
        module: String(moduleNumber).padStart(2, "0"),
        completed: tally.completedCount,
        total: tally.lessonCount,
        duration: runtimeLabel(tally.secondsLeft),
      })}
    </span>
  );
}
