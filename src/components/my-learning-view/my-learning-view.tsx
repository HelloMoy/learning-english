"use client";

import type { ContinueWatchingPanel } from "@/app/[locale]/actions";
import type { ResolveContinueWatching } from "@/app/[locale]/resolve-continue-watching";
import { CourseProgressList } from "@/components/course-progress-list/course-progress-list";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { HomeFirstLesson, HomeLevel } from "@/components/home-view/home-view";
import { LearnerAvatar } from "@/components/learner-avatar/learner-avatar";
import { LevelsTable } from "@/components/levels-table/levels-table";
import { ResumePanel } from "@/components/resume-panel/resume-panel";
import { StartPanel } from "@/components/start-panel/start-panel";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import type { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import {
  learnerFirstName,
  type LearnerProfile,
} from "@/domain/entities/learner-profile/learner-profile";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { useCourseContinueTarget } from "@/hooks/use-course-continue-target/use-course-continue-target";
import { useCourseWatchProgress } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import { usePlaybackPosition } from "@/hooks/use-playback-position/use-playback-position";
import { useResolvedContinueWatching } from "@/hooks/use-resolved-continue-watching/use-resolved-continue-watching";
import { courseOverviewPath } from "@/i18n/lesson-routes";
import { countModuleLessons } from "@/lib/module-lesson-count/module-lesson-count";
import { watchedFraction } from "@/lib/watch-progress/watch-progress";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** The learner's lesson being continued, resolved within the catalog. */
type Continued = {
  panel: ContinueWatchingPanel;
  lessonId: LessonId;
  level: HomeLevel;
};

/**
 * My learning: the learner's own page — a greeting, the way back into their
 * last lesson, their progress lesson by lesson, and every course.
 *
 * @remarks
 * The page belongs to a learner, so it waits for the profile: until storage
 * has answered it renders a shell, and a device without a profile is sent to
 * the onboarding.
 *
 * The continue-watching record decides the rest. It names the video opened
 * last; the page continues with that course's continue target instead (see
 * {@link useCourseContinueTarget}), so a finished video hands over to the next
 * one exactly as the course and module overviews do. While either resolves,
 * only the panel is reserved; a resolved target puts Resume in the panel, opens
 * its lesson's row and marks its course in the table. With nothing to
 * continue — or a record whose course is no longer in the catalog — the panel
 * offers the first video and the first course's progress is listed.
 *
 * @param levels - The catalog, one entry per course, in sequence order
 * @param firstLesson - The first course's first lesson, or `null` for an empty catalog
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 * @param continueWatching - Overrides the continue-watching adapter; tests inject a fake
 * @param resolve - Overrides the resolver; defaults to the Server Action
 * @param positions - Overrides the playback store; tests inject a fake
 */
export function MyLearningView({
  levels,
  firstLesson,
  profiles,
  continueWatching,
  resolve,
  positions,
}: {
  levels: ReadonlyArray<HomeLevel>;
  firstLesson: HomeFirstLesson | null;
  profiles?: LearnerProfileRepository;
  continueWatching?: ContinueWatchingRepository;
  resolve?: ResolveContinueWatching;
  positions?: PlaybackPositionRepository;
}) {
  const learner = useLearnerProfile(profiles);
  useLearnerRedirect(learner.status, { when: "absent", to: "/start" });

  if (learner.status !== "present") {
    return <MyLearningShell />;
  }
  const firstLevel = levels[0];
  if (!firstLevel || firstLesson === null) {
    return <CatalogEmpty />;
  }
  return (
    <LearnerPage
      profile={learner.profile}
      levels={levels}
      firstLevel={firstLevel}
      firstLesson={firstLesson}
      continueWatching={continueWatching}
      resolve={resolve}
      positions={positions}
    />
  );
}

function LearnerPage({
  profile,
  levels,
  firstLevel,
  firstLesson,
  continueWatching,
  resolve,
  positions,
}: {
  profile: LearnerProfile;
  levels: ReadonlyArray<HomeLevel>;
  firstLevel: HomeLevel;
  firstLesson: HomeFirstLesson;
  continueWatching?: ContinueWatchingRepository;
  resolve?: ResolveContinueWatching;
  positions?: PlaybackPositionRepository;
}) {
  const lastLesson = useResolvedContinueWatching({ continueWatching, resolve });
  const recordedLevel = levelOf(lastLesson, levels);
  const target = useCourseContinueTarget({
    course: recordedLevel ?? firstLevel,
    lastLesson: recordInCatalog(lastLesson, recordedLevel),
    resolve,
  });
  const continued = findContinued(target, levels);
  const progressLevel = continued?.level ?? firstLevel;
  const progress = useCourseWatchProgress(progressLevel.lessonRuntimes);

  return (
    <>
      <section className="flex flex-col gap-8">
        <Greeting profile={profile} />
        <div className="max-w-2xl">
          {target.status === "resolving" ? (
            <ResumePanelSkeleton />
          ) : continued ? (
            <ContinuedPanel
              continued={continued}
              positions={positions}
            />
          ) : (
            <StartPanel
              firstLessonHref={firstLesson.href}
              firstLessonMinutes={firstLesson.minutes}
              courseTitle={firstLevel.course.title}
            />
          )}
        </div>
      </section>
      <CourseProgressList
        courseSlug={progressLevel.course.slug}
        courseTitle={progressLevel.course.title}
        modules={progressLevel.modules}
        lessonRuntimes={progressLevel.lessonRuntimes}
        continued={
          continued
            ? {
                moduleId: continued.panel.moduleId,
                lessonTitle: continued.panel.lessonTitle,
                lessonHref: continued.panel.lessonHref,
              }
            : null
        }
      />
      <CoursesSection
        levels={levels}
        continued={
          continued
            ? { courseSlug: continued.level.course.slug, completedCount: progress.completedCount }
            : null
        }
      />
    </>
  );
}

const NOTHING_CONTINUED: ReturnType<typeof useResolvedContinueWatching> = { status: "none" };

function findContinued(
  lastLesson: ReturnType<typeof useResolvedContinueWatching>,
  levels: ReadonlyArray<HomeLevel>,
): Continued | null {
  const level = levelOf(lastLesson, levels);
  return level && lastLesson.status === "resolved"
    ? { panel: lastLesson.panel, lessonId: lastLesson.lessonId, level }
    : null;
}

/** The catalog course a resolved record belongs to, or `null`. */
function levelOf(
  lastLesson: ReturnType<typeof useResolvedContinueWatching>,
  levels: ReadonlyArray<HomeLevel>,
): HomeLevel | null {
  if (lastLesson.status !== "resolved") return null;
  return levels.find((candidate) => candidate.course.slug === lastLesson.panel.courseSlug) ?? null;
}

/** A resolved record whose course is not in the catalog continues nothing; any other state passes through. */
function recordInCatalog(
  lastLesson: ReturnType<typeof useResolvedContinueWatching>,
  level: HomeLevel | null,
): ReturnType<typeof useResolvedContinueWatching> {
  return lastLesson.status === "resolved" && level === null ? NOTHING_CONTINUED : lastLesson;
}

function Greeting({ profile }: { profile: LearnerProfile }) {
  const t = useTranslations("MyLearning");

  return (
    <div className="flex items-center gap-3.5 sm:gap-5">
      <LearnerAvatar
        name={profile.name}
        avatar={profile.avatar}
        size="md"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-sans text-[2.5rem] leading-none font-extrabold tracking-tight text-balance text-foreground sm:text-6xl">
          {t("greeting", { name: learnerFirstName(profile.name) })}
        </h1>
      </div>
    </div>
  );
}

function ContinuedPanel({
  continued,
  positions,
}: {
  continued: Continued;
  positions?: PlaybackPositionRepository;
}) {
  const { panel, lessonId, level } = continued;
  const fraction = useWatchedFraction(lessonId, panel.durationSeconds, positions);

  return (
    <ResumePanel
      panel={panel}
      moduleLessonCount={countModuleLessons(level.lessonRuntimes, panel.moduleId as ModuleId)}
      watchedFraction={fraction}
      courseHref={courseOverviewPath(level.course)}
    />
  );
}

function CoursesSection({
  levels,
  continued,
}: {
  levels: ReadonlyArray<HomeLevel>;
  continued: { courseSlug: string; completedCount: number } | null;
}) {
  const t = useTranslations("MyLearning");

  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("coursesEyebrow")}</Eyebrow>
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("coursesHeading", { count: levels.length })}
        </h2>
      </div>
      <LevelsTable
        courses={levels.map((level) => level.course)}
        continued={continued}
      />
    </section>
  );
}

/** The resume panel's shape, naming no lesson, while the record resolves. */
function ResumePanelSkeleton() {
  return (
    <div data-testid="resume-panel-skeleton">
      <PanelShape />
    </div>
  );
}

/** The outline shared by the resume and start panels. */
function PanelShape() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-4 rounded-[1.125rem] border border-border bg-card p-5 sm:p-6"
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-12 w-40 rounded-lg" />
    </div>
  );
}

/** The page's shape while storage has not said who the learner is. */
function MyLearningShell() {
  return (
    <div
      data-testid="my-learning-shell"
      aria-hidden="true"
      className="flex flex-col gap-8"
    >
      <div className="flex items-center gap-5">
        <Skeleton className="size-14 rounded-full sm:size-[4.5rem]" />
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-full max-w-md sm:h-14" />
        </div>
      </div>
      <div className="max-w-2xl">
        <PanelShape />
      </div>
    </div>
  );
}

function CatalogEmpty() {
  const t = useTranslations("MyLearning");

  return (
    <p
      className="text-sm text-muted-foreground"
      role="status"
    >
      {t("catalogEmpty")}
    </p>
  );
}

/**
 * The share of the continued video already watched, or `null` when there is
 * nothing honest to measure — a reading lesson, or a video never played.
 */
function useWatchedFraction(
  lessonId: LessonId,
  durationSeconds: number | null,
  positions?: PlaybackPositionRepository,
): number | null {
  const playback = usePlaybackPosition(lessonId, positions);
  const [fraction, setFraction] = useState<number | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void playback.get().then((positionSeconds) => {
      if (!isCurrent) return;
      setFraction(
        positionSeconds === null || durationSeconds === null
          ? null
          : watchedFraction(positionSeconds, durationSeconds),
      );
    });
    return () => {
      isCurrent = false;
    };
  }, [playback, durationSeconds]);

  return fraction;
}
