"use client";

import { ContinueTile, type ContinueReading } from "@/components/continue-tile/continue-tile";
import {
  CourseProgressTile,
  type CourseProgressReading,
} from "@/components/course-progress-tile/course-progress-tile";
import {
  LessonRingTile,
  type LessonRingReading,
} from "@/components/lesson-ring-tile/lesson-ring-tile";
import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { ModuleSummary } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useContinueWatching } from "@/hooks/use-continue-watching/use-continue-watching";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import {
  courseOverviewProgress,
  type CourseOverviewEntry,
  type CourseOverviewProgress,
} from "@/lib/course-overview-progress/course-overview-progress";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** Props for {@link CourseProgressBoard}. */
export type CourseProgressBoardProps = {
  course: Course;
  modules: ReadonlyArray<Module>;
  moduleSummaries: ReadonlyArray<ModuleSummary>;
  /** Overrides the continue-watching storage adapter; tests and stories inject a fake here. */
  continueWatching?: ContinueWatchingRepository;
};

/** A stored location that has not been read yet, as distinct from "no location" (`null`). */
const UNREAD = undefined;

/**
 * The course overview's progress board: the continue tile and the course
 * progress tile, then one ring tile per lesson.
 *
 * @remarks
 * This is the page's one client island. It reads the three device stores —
 * completion marks, playback positions and the continue-watching record — once,
 * and derives every tile from a single `courseOverviewProgress` reading so no two
 * tiles can disagree.
 *
 * Until the page has hydrated and the record has been read, every tile renders
 * its pending shape. On a phone the course tile comes first, then the continue
 * tile and one row per lesson; from `lg` the continue tile spans two thirds
 * beside the course tile, and lessons sit five to a row.
 *
 * @example
 * ```tsx
 * <CourseProgressBoard course={course} modules={modules} moduleSummaries={moduleSummaries} />
 * ```
 */
export function CourseProgressBoard({
  course,
  modules,
  moduleSummaries,
  continueWatching,
}: CourseProgressBoardProps) {
  const t = useTranslations("CourseCatalog.courseOverview");
  const entries = pairWithSummaries(modules, moduleSummaries);
  const progress = useBoardProgress(course, entries, continueWatching);
  const hasVideos = entries.some(({ summary }) => summary.lessons.length > 0);
  const continueReading = continueReadingOf(progress, entries);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:px-11 lg:gap-4">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:gap-4">
        {hasVideos && continueReading ? (
          <div className="lg:col-span-8">
            <ContinueTile
              course={course}
              reading={continueReading}
            />
          </div>
        ) : null}
        <div className="-order-1 lg:order-none lg:col-span-4 lg:flex lg:flex-col [&>section]:lg:flex-1">
          <CourseProgressTile
            course={course}
            reading={courseReadingOf(progress)}
          />
        </div>
      </div>
      <ol
        aria-label={t("trackLabel")}
        className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4"
      >
        {entries.map((entry, index) => (
          <li
            key={entry.module.id}
            className="flex [&>a]:flex-1"
          >
            <LessonRingTile
              course={course}
              module={entry.module}
              summary={entry.summary}
              reading={lessonReadingOf(progress, index)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function useBoardProgress(
  course: Course,
  entries: ReadonlyArray<CourseOverviewEntry>,
  repository?: ContinueWatchingRepository,
): CourseOverviewProgress | null {
  const isHydrated = useIsHydrated();
  const location = useStoredLocation(repository);
  const completedIds = useCompletedLessons();
  const positions = useSavedPlaybackPositions();

  if (!isHydrated || location === UNREAD) return null;
  return courseOverviewProgress({ course, entries, location, completedIds, positions });
}

function useStoredLocation(repository?: ContinueWatchingRepository) {
  const continueWatching = useContinueWatching(repository);
  const [location, setLocation] = useState<ContinueWatchingLocation | null | typeof UNREAD>(UNREAD);

  useEffect(() => {
    let isCurrent = true;
    void continueWatching.get().then((stored) => {
      if (isCurrent) setLocation(stored);
    });
    return () => {
      isCurrent = false;
    };
  }, [continueWatching]);

  return location;
}

function continueReadingOf(
  progress: CourseOverviewProgress | null,
  entries: ReadonlyArray<CourseOverviewEntry>,
): ContinueReading | null {
  if (!progress) return { status: "pending" };
  const target = progress.continueTarget;
  if (target.kind === "none") return null;
  const entry = entries.find(({ module }) => module.id === target.module.id);
  return { status: "read", target, videoCount: entry?.summary.lessons.length ?? 0 };
}

function courseReadingOf(progress: CourseOverviewProgress | null): CourseProgressReading {
  return progress ? { status: "read", tally: progress.course } : { status: "pending" };
}

function lessonReadingOf(
  progress: CourseOverviewProgress | null,
  index: number,
): LessonRingReading {
  const moduleProgress = progress?.modules[index];
  return moduleProgress ? { status: "read", progress: moduleProgress } : { status: "pending" };
}

function pairWithSummaries(
  modules: ReadonlyArray<Module>,
  moduleSummaries: ReadonlyArray<ModuleSummary>,
): CourseOverviewEntry[] {
  const summaryByModule = new Map(moduleSummaries.map((summary) => [summary.moduleId, summary]));
  return modules.flatMap((module) => {
    const summary = summaryByModule.get(module.id);
    return summary ? [{ module, summary }] : [];
  });
}
