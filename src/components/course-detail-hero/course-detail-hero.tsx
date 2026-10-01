"use client";

import { CinemaHeroArtwork } from "@/components/cinema-hero-artwork/cinema-hero-artwork";
import { CourseEnrollAction } from "@/components/course-enroll-action/course-enroll-action";
import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useEnrolledCourses } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseCopy } from "@/lib/course-copy/course-copy";
import {
  courseFacts,
  courseFirstVideo,
  coursePrizes,
  type FirstVideo,
} from "@/lib/course-shelf/course-shelf";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

/** Props for {@link CourseDetailHero}. */
export type CourseDetailHeroProps = {
  /** The course the page presents. */
  view: CourseForView;
};

/**
 * The course page's opening frame: the course's first video's artwork, what
 * kind of course it is, how big it is, and the enroll action.
 *
 * @remarks
 * It draws its artwork with {@link CinemaHeroArtwork}, and shows the same first
 * video as the poster's **View details** on Available courses. The mark reads `Level N`
 * or **Reference**, and **Enrolled** once the learner joins. On wide screens a
 * chip names the first video; it is deliberately not a link, because opening
 * a video enrolls the learner (capability `course-enrollment`). The facts line
 * counts modules as lessons and lessons as videos (`course-vocabulary`), and
 * the prizes render as silhouettes: nothing is claimed before joining. The
 * description is shown in the active locale through `courseCopy`; the title
 * is never translated.
 *
 * @example
 * ```tsx
 * <CourseDetailHero view={courseView} />
 * ```
 */
export function CourseDetailHero({ view }: CourseDetailHeroProps) {
  const firstVideo = courseFirstVideo(view);
  const { description } = courseCopy(view.course, useLocale());

  return (
    <article
      data-testid="course-detail-hero"
      className="relative isolate flex min-h-[28rem] flex-col justify-end gap-3 overflow-hidden rounded-[22px] border border-border bg-background p-5 pt-16 sm:p-7 sm:pt-24 lg:aspect-[21/9] lg:min-h-0 lg:rounded-[26px] lg:p-8"
    >
      <CinemaHeroArtwork poster={firstVideo?.lesson.poster} />
      <StandingMark view={view} />
      {firstVideo ? <FirstVideoChip firstVideo={firstVideo} /> : null}
      <FactsLine view={view} />
      <h1 className="max-w-[18ch] text-[2.25rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground lg:text-[3.25rem]">
        {view.course.title}
      </h1>
      <p className="max-w-[56ch] text-[0.9375rem] text-foreground/80">{description}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <PrizeRow view={view} />
        <CourseEnrollAction view={view} />
      </div>
    </article>
  );
}

function StandingMark({ view }: { view: CourseForView }) {
  const t = useTranslations("Components.CourseDetailHero");
  const isEnrolled = useEnrolledCourses().has(view.course.slug);
  const { standing } = view;
  const label = isEnrolled
    ? t("enrolled")
    : standing.kind === "level"
      ? t("level", { level: standing.number })
      : t("reference");

  return (
    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground lg:top-5 lg:left-5">
      {isEnrolled ? (
        <Check
          aria-hidden="true"
          className="size-3"
        />
      ) : null}
      {label}
    </span>
  );
}

function FirstVideoChip({ firstVideo }: { firstVideo: FirstVideo }) {
  const t = useTranslations("Components.CourseDetailHero");
  const { lesson } = firstVideo;

  return (
    <span
      data-testid="course-detail-hero-first-video"
      className="absolute top-4 right-4 hidden max-w-[18rem] items-center gap-2.5 rounded-[14px] border border-border bg-background/70 py-2 pr-3 pl-2 text-foreground backdrop-blur sm:flex lg:top-5 lg:right-5"
    >
      {lesson.poster ? (
        <span className="relative aspect-video w-[4.5rem] shrink-0 overflow-hidden rounded-[7px]">
          <Image
            src={lesson.poster}
            alt=""
            fill
            sizes="72px"
            className="object-cover"
          />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col">
        <span className="text-[0.625rem] font-bold tracking-[0.2em] text-gold uppercase">
          {t("firstVideo")}
        </span>
        <span className="truncate text-sm font-extrabold">{lesson.title}</span>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {formatMinutesSeconds(lesson.durationSeconds)}
        </span>
      </span>
    </span>
  );
}

function FactsLine({ view }: { view: CourseForView }) {
  const t = useTranslations("Components.CourseDetailHero");
  const runtimeLabel = useRuntimeLabel();
  const facts = courseFacts(view);
  const counts = {
    lessons: facts.moduleCount,
    videos: facts.videoCount,
    runtime: runtimeLabel(facts.runtimeSeconds),
  };

  return (
    <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
      {view.standing.kind === "level"
        ? t("facts", { level: view.standing.number, ...counts })
        : t("referenceFacts", counts)}
    </span>
  );
}

function PrizeRow({ view }: { view: CourseForView }) {
  const t = useTranslations("Components.CourseDetailHero");
  const prizes = coursePrizes(view, new Set());
  if (prizes.length === 0) return <span />;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {prizes.map((entry, index) => (
        <PrizeIcon
          key={`${entry.prize}-${index}`}
          prize={entry.prize}
          locked
          size={24}
        />
      ))}
      <span className="ml-1.5 font-mono text-xs text-muted-foreground tabular-nums">
        {t("prizes", { count: prizes.length })}
      </span>
    </span>
  );
}
