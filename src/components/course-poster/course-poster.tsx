"use client";

import { CourseBrief } from "@/components/course-brief/course-brief";
import { ProgressRing } from "@/components/progress-ring/progress-ring";
import type { CourseStanding } from "@/domain/entities/course-standing/course-standing";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { courseDetailPath, courseOverviewPath, lessonPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { LobbyEntry } from "@/lib/course-lobby/course-lobby";
import {
  courseFacts,
  courseFirstVideo,
  coursePrizes,
  type CourseCardModel,
  type TargetVideo,
} from "@/lib/course-shelf/course-shelf";
import { formatMinutesSeconds } from "@/lib/format-minutes-seconds/format-minutes-seconds";

import { Check, Play, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

/** Props for {@link CoursePoster}. */
export type CoursePosterProps = {
  /** The course, read with the learner's progress when they are enrolled in it. */
  entry: LobbyEntry;
};

const ACTION_KEY: Record<TargetVideo["kind"], "continueCourse" | "startCourse" | "watchAgain"> = {
  continue: "continueCourse",
  start: "startCourse",
  rewatch: "watchAgain",
};

const NO_CLAIMED_PRIZES: ReadonlySet<string> = new Set();

const EYEBROW = "line-clamp-2 text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase";
const FOCUS_RING = "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
const PRIMARY_ACTION = `inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-[0.9375rem] font-extrabold whitespace-nowrap text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter] hover:brightness-105 ${FOCUS_RING}`;
const SECONDARY_ACTION = `inline-flex min-h-11 flex-1 items-center justify-center rounded-[12px] border border-border bg-background/50 px-4 text-[0.9375rem] font-bold whitespace-nowrap text-foreground transition-colors hover:bg-background/80 ${FOCUS_RING}`;

/**
 * One course of Available courses' lobby, drawn as a vertical cinema poster:
 * artwork, its level, its title, who it is for and what it teaches, and the
 * way in.
 *
 * @remarks
 * Two readings share the frame:
 *
 * - **Enrolled** — the continue target's artwork, an Enrolled (or Completed)
 *   chip, a progress ring, **Resume at mm:ss** or **Next up** with the
 *   target's title, the videos watched and the time left, **Continue course**
 *   / **Start course** / **Watch again** and **View progress**, which opens
 *   the course overview, and a progress edge along the bottom.
 * - **Joinable** — the first video's artwork, the course's size, the prizes it
 *   awards, and **Enroll** and **View details**, which both open the course
 *   page. Neither enrolls: the learner joins from the course page's own
 *   action.
 *
 * The frame is at least 3:4 from `lg` up and at least 22 rem tall below, and
 * always keeps a band of artwork above the copy; a longer brief grows the
 * poster rather than covering its chips. The artwork fades into the page
 * background under the copy so it reads in both themes.
 *
 * @example
 * ```tsx
 * {courseLobby(enrolled, courses).map((entry) => <CoursePoster entry={entry} />)}
 * ```
 */
export function CoursePoster({ entry }: CoursePosterProps) {
  return entry.kind === "enrolled" ? (
    <EnrolledPoster model={entry.model} />
  ) : (
    <JoinablePoster view={entry.view} />
  );
}

function EnrolledPoster({ model }: { model: CourseCardModel }) {
  const t = useTranslations("Components.CoursePoster");
  const { course, target, tally, isCompleted } = model;

  return (
    <PosterFrame
      artwork={target?.lesson.poster}
      chips={
        <>
          <StandingChip standing={model.standing} />
          {isCompleted ? (
            <Chip tone="gold">{t("completed")}</Chip>
          ) : (
            <Chip tone="primary">{t("enrolled")}</Chip>
          )}
        </>
      }
      ring={<PosterRing fraction={tally.completedFraction} />}
      edge={tally.completedFraction}
    >
      {target ? (
        <TargetLine
          target={target}
          positionSeconds={model.targetPositionSeconds}
        />
      ) : null}
      <PosterTitle>{course.title}</PosterTitle>
      <CourseBrief course={course} />
      <ProgressLine model={model} />
      <PosterActions>
        {target ? (
          <Link
            href={lessonPath(course, target.module, target.lesson) as never}
            className={PRIMARY_ACTION}
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
          className={SECONDARY_ACTION}
        >
          {t("viewProgress")}
        </Link>
      </PosterActions>
    </PosterFrame>
  );
}

function JoinablePoster({ view }: { view: CourseForView }) {
  const t = useTranslations("Components.CoursePoster");
  const runtimeLabel = useRuntimeLabel();
  const { course } = view;
  const facts = courseFacts(view);
  const prizeCount = coursePrizes(view, NO_CLAIMED_PRIZES).length;

  return (
    <PosterFrame
      artwork={courseFirstVideo(view)?.lesson.poster}
      chips={<StandingChip standing={view.standing} />}
    >
      <span className={EYEBROW}>
        {t("facts", {
          modules: facts.moduleCount,
          videos: facts.videoCount,
          runtime: runtimeLabel(facts.runtimeSeconds),
        })}
      </span>
      <PosterTitle>{course.title}</PosterTitle>
      <CourseBrief course={course} />
      {prizeCount > 0 ? (
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {t("prizesToWin", { count: prizeCount })}
        </span>
      ) : null}
      <PosterActions>
        <Link
          href={courseDetailPath(course) as never}
          className={PRIMARY_ACTION}
        >
          <Plus
            aria-hidden="true"
            className="size-4"
          />
          {t("enroll")}
        </Link>
        <Link
          href={courseDetailPath(course) as never}
          className={SECONDARY_ACTION}
        >
          {t("viewDetails")}
        </Link>
      </PosterActions>
    </PosterFrame>
  );
}

function PosterFrame({
  artwork,
  chips,
  ring,
  edge,
  children,
}: {
  artwork: string | undefined;
  chips: ReactNode;
  ring?: ReactNode;
  edge?: number;
  children: ReactNode;
}) {
  return (
    <article
      data-testid="course-poster"
      className="relative isolate flex min-h-[22rem] flex-col justify-end gap-2.5 overflow-hidden rounded-[22px] border border-border bg-background p-5 pt-40 lg:aspect-[3/4] lg:pt-20"
    >
      <PosterArtwork poster={artwork} />
      <span className="absolute top-4 left-4 flex flex-wrap gap-1.5">{chips}</span>
      {ring ? (
        <span className="absolute top-3.5 right-3.5 rounded-full bg-background/70 backdrop-blur">
          {ring}
        </span>
      ) : null}
      {children}
      {edge === undefined ? null : <ProgressEdge fraction={edge} />}
    </article>
  );
}

function PosterArtwork({ poster }: { poster: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-secondary"
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover object-[center_25%]"
        />
      ) : null}
      <span className="absolute inset-0 bg-linear-to-t from-background from-[40%] via-background/70 via-60% to-transparent to-90%" />
    </span>
  );
}

function StandingChip({ standing }: { standing: CourseStanding }) {
  const t = useTranslations("Components.CoursePoster");
  return (
    <Chip tone="glass">
      {standing.kind === "level" ? t("level", { level: standing.number }) : t("reference")}
    </Chip>
  );
}

const CHIP_TONE = {
  glass: "border border-white/20 bg-black/55 text-white backdrop-blur",
  primary: "bg-primary text-primary-foreground",
  gold: "bg-gold text-primary-foreground",
} as const;

function Chip({ tone, children }: { tone: keyof typeof CHIP_TONE; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${CHIP_TONE[tone]}`}
    >
      {tone === "glass" ? null : (
        <Check
          aria-hidden="true"
          className="size-3"
        />
      )}
      {children}
    </span>
  );
}

function PosterRing({ fraction }: { fraction: number }) {
  const t = useTranslations("Components.CoursePoster");
  return (
    <ProgressRing
      size={48}
      fraction={fraction}
      glow={false}
    >
      <span className="text-[0.6875rem] font-black text-foreground tabular-nums">
        {t("percent", { percent: fraction })}
      </span>
    </ProgressRing>
  );
}

function TargetLine({
  target,
  positionSeconds,
}: {
  target: TargetVideo;
  positionSeconds: number | null;
}) {
  const t = useTranslations("Components.CoursePoster");
  const title = target.lesson.title;
  const isResumable = target.kind === "continue" && positionSeconds !== null;

  return (
    <span className={EYEBROW}>
      {isResumable
        ? t("resumeAt", { time: formatMinutesSeconds(positionSeconds), title })
        : t("nextUp", { title })}
    </span>
  );
}

function PosterTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[1.75rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground">
      {children}
    </h2>
  );
}

function ProgressLine({ model }: { model: CourseCardModel }) {
  const t = useTranslations("Components.CoursePoster");
  const runtimeLabel = useRuntimeLabel();
  const { tally, isCompleted } = model;

  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {t("progress", { completed: tally.completedCount, total: tally.lessonCount })}
      <span aria-hidden="true"> · </span>
      {isCompleted ? t("allWatched") : t("timeLeft", { duration: runtimeLabel(tally.secondsLeft) })}
    </span>
  );
}

function PosterActions({ children }: { children: ReactNode }) {
  return <div className="mt-1 flex flex-wrap gap-2">{children}</div>;
}

function ProgressEdge({ fraction }: { fraction: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-[5px] bg-secondary"
    >
      <span
        data-testid="course-poster-edge"
        className="block h-full bg-primary"
        style={{ width: `${fraction * 100}%` }}
      />
    </span>
  );
}
