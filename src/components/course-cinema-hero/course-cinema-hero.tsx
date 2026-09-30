import { CinemaHeroArtwork } from "@/components/cinema-hero-artwork/cinema-hero-artwork";
import { PrizeIcon } from "@/components/prize-icon/prize-icon";
import { ProgressRing } from "@/components/progress-ring/progress-ring";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseOverviewPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { CourseCardModel, TargetVideo } from "@/lib/course-shelf/course-shelf";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";

import { Check, Play, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/**
 * Why the hero leads the page: the course last watched, the learner's only
 * course, or — for a learner enrolled in nothing — the recommended first course.
 */
export type CinemaHeroLabel = "last-watched" | "your-course" | "recommended";

/** Props for {@link CourseCinemaHero}. */
export type CourseCinemaHeroProps = {
  model: CourseCardModel;
  label: CinemaHeroLabel;
};

const LABEL_KEY: Record<Exclude<CinemaHeroLabel, "recommended">, "lastWatched" | "yourCourse"> = {
  "last-watched": "lastWatched",
  "your-course": "yourCourse",
};

const ACTION_KEY: Record<TargetVideo["kind"], "continueCourse" | "startCourse" | "watchAgain"> = {
  continue: "continueCourse",
  start: "startCourse",
  rewatch: "watchAgain",
};

/**
 * Available courses' lead: one course as a wide cinema frame — its next
 * video's artwork, what the learner has done in it, and the way back in.
 *
 * @remarks
 * The artwork is the continue target's poster, so the frame shows exactly the
 * video **Continue course** opens. A chip names that video: **Resume at mm:ss**
 * when a position is saved, **Next up** otherwise. The footer carries a small
 * ring, the videos and time left, and the course's prizes with the claimed
 * ones lit. The action reads **Continue course**, **Start course** or **Watch
 * again** by the target's kind; **View course** opens the overview.
 *
 * The artwork fades into the page background, as on the course overview's
 * continue tile, so the copy reads in both themes.
 *
 * @example
 * ```tsx
 * <CourseCinemaHero model={courseCardModel(shelf.featured, learner)} label="last-watched" />
 * ```
 */
export function CourseCinemaHero({ model, label }: CourseCinemaHeroProps) {
  const t = useTranslations("Components.CourseCinemaHero");
  const { course, target, standing } = model;
  const facts = { modules: model.facts.moduleCount, videos: model.facts.videoCount };

  return (
    <section
      data-testid="course-cinema-hero"
      className="flex flex-col gap-3"
    >
      {label === "recommended" ? null : (
        <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
          {t(LABEL_KEY[label])}
        </span>
      )}
      <article className="relative isolate flex min-h-[26rem] flex-col justify-end gap-3 overflow-hidden rounded-[22px] border border-border bg-background p-5 sm:p-7 lg:aspect-[21/9] lg:min-h-0 lg:rounded-[26px] lg:p-8">
        <CinemaHeroArtwork poster={target?.lesson.poster} />
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground lg:top-5 lg:left-5">
          {label === "recommended" ? (
            <Star
              aria-hidden="true"
              className="size-3"
              fill="currentColor"
            />
          ) : (
            <Check
              aria-hidden="true"
              className="size-3"
            />
          )}
          {t(label === "recommended" ? "recommended" : "enrolled")}
        </span>
        {target ? (
          <NextVideoChip
            target={target}
            positionSeconds={model.targetPositionSeconds}
          />
        ) : null}
        <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
          {standing.kind === "level"
            ? t("facts", { level: standing.number, ...facts })
            : t("referenceFacts", facts)}
        </span>
        <h2 className="max-w-[18ch] text-[2rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground lg:text-[3.25rem]">
          {course.title}
        </h2>
        <HeroFooter model={model} />
      </article>
    </section>
  );
}

function NextVideoChip({
  target,
  positionSeconds,
}: {
  target: TargetVideo;
  positionSeconds: number | null;
}) {
  const t = useTranslations("Components.CourseCinemaHero");
  const isResumable = target.kind === "continue" && positionSeconds !== null;

  return (
    <span className="absolute top-4 right-4 hidden max-w-[18rem] items-center gap-2.5 rounded-[14px] border border-border bg-background/70 py-2 pr-3 pl-2 text-foreground backdrop-blur sm:flex lg:top-5 lg:right-5">
      {target.lesson.poster ? (
        <span className="relative aspect-video w-[4.5rem] shrink-0 overflow-hidden rounded-[7px]">
          <Image
            src={target.lesson.poster}
            alt=""
            fill
            sizes="72px"
            className="object-cover"
          />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col">
        <span className="text-[0.625rem] font-bold tracking-[0.2em] text-gold uppercase">
          {isResumable
            ? t("resumeAt", { time: formatMinutesSeconds(positionSeconds) })
            : t("nextUp")}
        </span>
        <span className="truncate text-sm font-extrabold">{target.lesson.title}</span>
      </span>
    </span>
  );
}

function HeroFooter({ model }: { model: CourseCardModel }) {
  const t = useTranslations("Components.CourseCinemaHero");
  const runtimeLabel = useRuntimeLabel();
  const { tally, target, course, prizes } = model;
  const claimed = prizes.filter((entry) => entry.isClaimed).length;
  const remaining =
    tally.lessonCount > 0 && tally.completedCount === tally.lessonCount
      ? t("allWatched")
      : t("timeLeft", { duration: runtimeLabel(tally.secondsLeft) });

  return (
    <div className="mt-1 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
      <div className="flex items-center gap-3.5">
        <ProgressRing
          size={56}
          fraction={tally.completedFraction}
        >
          <span className="text-xs font-black">
            {t("percent", { percent: tally.completedFraction })}
          </span>
        </ProgressRing>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {t("progress", { completed: tally.completedCount, total: tally.lessonCount })}
            <span aria-hidden="true"> · </span>
            {remaining}
          </span>
          {prizes.length > 0 ? (
            <span className="flex items-center gap-2">
              <span className="sr-only">{t("prizes", { claimed, total: prizes.length })}</span>
              <span
                aria-hidden="true"
                className="flex flex-wrap gap-1"
              >
                {prizes.map((entry, index) => (
                  <PrizeIcon
                    key={`${entry.prize}-${index}`}
                    prize={entry.prize}
                    locked={!entry.isClaimed}
                    size={20}
                  />
                ))}
              </span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {target ? (
          <Link
            href={lessonPath(course, target.module, target.lesson) as never}
            className="inline-flex min-h-13 items-center gap-2.5 rounded-[14px] bg-primary px-5.5 text-base font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
          >
            <Play
              aria-hidden="true"
              className="size-4"
              fill="currentColor"
            />
            {t(ACTION_KEY[target.kind])}
          </Link>
        ) : null}
        <Link
          href={courseOverviewPath(course) as never}
          className="inline-flex min-h-13 items-center rounded-[14px] border border-border bg-background/50 px-5 text-[0.9375rem] font-bold text-foreground transition-colors hover:bg-background/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {t("viewCourse")}
        </Link>
      </div>
    </div>
  );
}
