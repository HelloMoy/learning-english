import { CourseSection } from "@/components/course-section/course-section";
import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import type { Module } from "@/domain/entities/module/module";
import type {
  CourseForView,
  ModuleSummary,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";
import { prizeForModule } from "@/lib/module-prizes/module-prizes";

import { ChevronDown, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/** Props for {@link CourseSyllabus}. */
export type CourseSyllabusProps = {
  /** The course whose lessons and videos to list. */
  view: CourseForView;
};

/**
 * The course page's syllabus: every lesson in `sequence` order as a
 * disclosure row that opens to its videos.
 *
 * @remarks
 * Rows are native `<details>` elements, so they open from the keyboard and
 * report their state to assistive technology without client script. A row
 * shows `Lesson N`, the lesson's first video's artwork, its title, its video
 * count and runtime, and the prize it redeems as a silhouette; open, it lists
 * each video as `Video N`, title and duration. Ordinals sit outside the titles
 * so truncation never hides them (capability `course-vocabulary`).
 *
 * @example
 * ```tsx
 * <CourseSyllabus view={courseView} />
 * ```
 */
export function CourseSyllabus({ view }: CourseSyllabusProps) {
  const t = useTranslations("Components.CourseSyllabus");

  return (
    <CourseSection
      eyebrow={t("eyebrow")}
      heading={t("heading", { count: view.modules.length })}
    >
      <ol
        aria-label={t("listLabel")}
        className="overflow-hidden rounded-[18px] border border-border bg-card"
      >
        {view.modules.map((courseModule, index) => (
          <li
            key={courseModule.id}
            className="border-border not-first:border-t"
          >
            <LessonRow
              courseModule={courseModule}
              summary={view.moduleSummaries[index]!}
            />
          </li>
        ))}
      </ol>
    </CourseSection>
  );
}

function LessonRow({ courseModule, summary }: { courseModule: Module; summary: ModuleSummary }) {
  const t = useTranslations("Components.CourseSyllabus");
  const runtimeLabel = useRuntimeLabel();
  const poster = summary.lessons[0]?.poster;

  return (
    <details className="group">
      <summary className="grid cursor-pointer list-none grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3.5 px-3.5 py-3 transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:grid-cols-[5.5rem_minmax(0,1fr)_auto_auto] sm:px-4 [&::-webkit-details-marker]:hidden">
        <span className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
          {poster ? (
            <Image
              src={poster}
              alt=""
              fill
              sizes="88px"
              className="object-cover brightness-75 saturate-[0.65]"
            />
          ) : null}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[0.6875rem] font-bold tracking-[0.2em] text-gold uppercase">
            {t("lessonOrdinal", { number: courseModule.sequence })}
          </span>
          <h3 className="line-clamp-2 text-[0.975rem] leading-tight font-extrabold text-foreground">
            {courseModule.title}
          </h3>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {t("lessonFacts", {
              videos: summary.lessons.length,
              runtime: runtimeLabel(summary.totalDurationSeconds),
            })}
          </span>
        </span>
        {summary.lessons.length > 0 ? (
          <span className="hidden sm:block">
            <PrizeIcon
              prize={prizeForModule(courseModule.slug)}
              locked
              size={30}
            />
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className="size-5 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <VideoList summary={summary} />
    </details>
  );
}

function VideoList({ summary }: { summary: ModuleSummary }) {
  const t = useTranslations("Components.CourseSyllabus");

  return (
    <ol className="flex flex-col px-3.5 pb-3 sm:px-4">
      {summary.lessons.map((lesson) => (
        <li
          key={lesson.id}
          className="grid grid-cols-[1rem_4.25rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-dashed border-border py-2.5 text-sm"
        >
          <Play
            aria-hidden="true"
            className="size-3.5 text-muted-foreground"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {t("videoOrdinal", { number: lesson.sequence })}
          </span>
          <span className="min-w-0 text-foreground">{lesson.title}</span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatMinutesSeconds(lesson.durationSeconds)}
          </span>
        </li>
      ))}
    </ol>
  );
}
