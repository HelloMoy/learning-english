"use client";

import type { Course } from "@/domain/entities/course/course";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { toLessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import {
  useCourseWatchProgress,
  type CourseWatchProgress,
  type WatchTally,
} from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";

import { useFormatter, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { ModuleList } from "../module-list/module-list";

/** What the rows receive while there is no reading: every row falls back to its size. */
const NO_READING: ReadonlyMap<string, WatchTally> = new Map();

/** The course-wide reading the summary states. */
type CourseReading =
  | { kind: "size"; videoCount: number; lessonCount: number }
  | {
      kind: "progress";
      completedVideos: number;
      videoCount: number;
      completedLessons: number;
      lessonCount: number;
      fraction: number;
    };

/**
 * The Course outline sidebar. Renders the course's modules and lessons in
 * `sequence` order with the current lesson indicated. The component itself
 * does not own the responsive shell — the page chooses where the outline
 * sits (sidebar on desktop, drawer on mobile).
 *
 * @remarks
 * The heading is pinned to the top of whatever scroll region the shell puts
 * the outline in. Both shells bound their height and scroll the current
 * lesson into view, which on a long course would carry the heading out of
 * sight and leave the sidebar visually unlabelled. Pinning costs nothing
 * when there is no scroll region — `sticky` is inert without one.
 *
 * A shell whose own control already says "Course outline" — the mobile
 * drawer's `<summary>` — passes `showHeading={false}` so the words do not
 * appear twice. The `<nav>` keeps its `aria-label` either way, so the region
 * never loses its accessible name.
 *
 * The heading's height is published as `--outline-heading-offset` so the
 * module titles below can pin themselves just under it. Keeping the value
 * here means the heading that causes the offset also owns it; when the
 * heading is not rendered the offset is zero.
 *
 * Under the heading sits a course summary — a bar, the completed share and
 * `35 of 107 videos · 4 of 10 lessons completed` — and every module row states
 * its own share. Both come from one `useCourseWatchProgress` call, so they
 * count by the same rule as the video rows' completion marks. Progress lives
 * in `localStorage`, so until hydration commits, and for a learner who has
 * completed nothing, the summary states the course's size and the rows their
 * video counts: no frame asserts a share the page cannot know. The summary is
 * not pinned; pinning it would push every pinned module title down.
 *
 * @param showHeading - Whether to render the visible heading; `false` when the shell provides one
 */
export function Outline({
  course,
  modules,
  lessonsByModuleId,
  currentLessonId,
  showHeading = true,
}: {
  course: Course;
  modules: Module[];
  lessonsByModuleId: Map<string, Lesson[]>;
  currentLessonId: LessonId;
  showHeading?: boolean;
}) {
  const t = useTranslations("Components.Outline");
  const progress = useCourseWatchProgress(
    [...lessonsByModuleId.values()].flat().map(toLessonProgressSlice),
  );
  const hasReading = useIsHydrated() && progress.completedCount > 0;
  // `text-xs` (1rem line box) plus the heading's `pb-3` (0.75rem).
  const headingOffset = showHeading ? "1.75rem" : "0rem";
  return (
    <nav
      aria-label={t("title")}
      className="text-sm"
      style={{ "--outline-heading-offset": headingOffset } as CSSProperties}
    >
      {/* The gap below the heading is padding, not margin: a margin is
          transparent, so rows would scroll visibly through it. */}
      {showHeading ? (
        <h2 className="sticky top-0 z-10 bg-card pb-3 text-xs font-bold tracking-[0.24em] text-gold uppercase">
          {t("title")}
        </h2>
      ) : null}
      <CourseProgressSummary
        reading={courseReadingFor({ progress, lessonCount: modules.length, hasReading })}
      />
      <ModuleList
        course={course}
        modules={modules}
        lessonsByModuleId={lessonsByModuleId}
        currentLessonId={currentLessonId}
        progressByModuleId={hasReading ? progress.byModuleId : NO_READING}
      />
    </nav>
  );
}

/**
 * What the summary may state: the learner's share once there is a reading,
 * the course's size until then.
 *
 * @param progress - The course tally, per module included
 * @param lessonCount - How many modules — "lessons" to the learner — the course holds
 * @param hasReading - Whether hydration has committed and something is complete
 * @returns The reading the summary renders
 */
function courseReadingFor({
  progress,
  lessonCount,
  hasReading,
}: {
  progress: CourseWatchProgress;
  lessonCount: number;
  hasReading: boolean;
}): CourseReading {
  if (!hasReading) return { kind: "size", videoCount: progress.lessonCount, lessonCount };
  return {
    kind: "progress",
    completedVideos: progress.completedCount,
    videoCount: progress.lessonCount,
    completedLessons: countFinishedModules(progress.byModuleId),
    lessonCount,
    fraction: progress.completedFraction,
  };
}

function countFinishedModules(byModuleId: ReadonlyMap<string, WatchTally>): number {
  return [...byModuleId.values()].filter(
    (tally) => tally.lessonCount > 0 && tally.completedCount === tally.lessonCount,
  ).length;
}

/**
 * The course-wide bar and line under the heading. The bar is decorative — the
 * line and the percentage beside it are the reading — so the outline adds no
 * `progressbar` of its own.
 */
function CourseProgressSummary({ reading }: { reading: CourseReading }) {
  const t = useTranslations("Components.Outline");
  const format = useFormatter();
  const fraction = reading.kind === "progress" ? reading.fraction : 0;

  return (
    <div className="space-y-2 pb-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="block h-1 flex-1 overflow-hidden rounded-full bg-foreground/10"
        >
          {fraction > 0 ? (
            <span
              data-testid="outline-summary-fill"
              className="block h-full rounded-full bg-gold"
              style={{ width: `${fraction * 100}%` }}
            />
          ) : null}
        </span>
        {reading.kind === "progress" ? (
          <span
            data-testid="outline-summary-percent"
            className="font-mono text-xs font-semibold text-gold"
          >
            {format.number(reading.fraction, { style: "percent" })}
          </span>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {reading.kind === "progress"
          ? t("courseSummary", {
              completed: reading.completedVideos,
              total: reading.videoCount,
              completedLessons: reading.completedLessons,
              lessonCount: reading.lessonCount,
            })
          : t("courseSize", { total: reading.videoCount, lessonCount: reading.lessonCount })}
      </p>
    </div>
  );
}
