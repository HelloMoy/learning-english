"use client";

import { CourseLevelCard } from "@/components/course-level-card/course-level-card";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import { useContinueWatching } from "@/hooks/use-continue-watching/use-continue-watching";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** One rung of the ladder: a course and the modules its card previews. */
export type CourseLevel = {
  course: Course;
  leadingModules: Module[];
};

/**
 * The home's ladder of available courses.
 *
 * @remarks
 * A client component for one reason: which course is in progress lives in
 * `localStorage`, and only the browser can answer. Everything else — the
 * courses, their order, their modules — arrives as props from the server, so
 * the ladder is complete and readable in the first paint and the record only
 * refines it.
 *
 * Before the record is known, every card reads as not started. That is the
 * honest state rather than a placeholder: a learner who has watched nothing
 * and a learner whose storage is blocked both genuinely have no course in
 * progress, and no card ever flashes a mark it cannot justify.
 *
 * The course in progress is matched by slug. The record names one lesson, and
 * the course that lesson belongs to is the one being continued — no aggregate
 * progress query is needed, and a record pointing at a retired course simply
 * matches nothing.
 *
 * @param continueWatching - Overrides the storage adapter; tests inject a
 *                           fake here instead of driving `window.localStorage`
 */
export function CourseLadder({
  levels,
  continueWatching,
}: {
  levels: ReadonlyArray<CourseLevel>;
  continueWatching?: ContinueWatchingRepository;
}) {
  const t = useTranslations("Components.CourseLadder");
  const isHydrated = useIsHydrated();
  const locations = useContinueWatching(continueWatching);
  const [inProgressCourseSlug, setInProgressCourseSlug] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void locations.get().then((location) => {
      if (isCurrent) {
        setInProgressCourseSlug(location?.courseSlug ?? null);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [locations]);

  const isInProgress = (course: Course): boolean =>
    isHydrated && inProgressCourseSlug === course.slug;

  // A third column only once there is a third course. Fixing the grid at
  // three would leave a visible hole beside a two-course catalog — the empty
  // slot the ladder exists to avoid.
  //
  // `grid-cols-1` is not decoration. Without an explicit base the single
  // column below `md` is an `auto` track, which is sized to its content's
  // max-content width — and a card holds a `truncate`d module title, whose
  // nowrap intrinsic width is the whole string. The phone home then scrolled
  // sideways by ~150px. `grid-cols-1` is `repeat(1, minmax(0, 1fr))`, which
  // caps the track at the container and lets the title truncate as intended.
  const columns =
    levels.length >= 3 ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="flex flex-col gap-8">
      {/*
        The track shares the cards' grid rather than spreading across the full
        width, so each node sits at the head of the card it numbers. Laid out
        as a flex row instead, the last node drifts to the far edge and stops
        looking like it belongs to anything.

        Hidden below `md`, where the cards stack into one column: a track that
        runs top to bottom says nothing a stack of cards does not already say,
        and its connecting rules dangle off the last node. Each card carries
        its own `Level N`, so no information is lost.
      */}
      <div
        data-testid="course-ladder-track"
        aria-hidden="true"
        className={cn("hidden gap-6 md:grid", columns)}
      >
        {levels.map((level, index) => (
          <div
            key={level.course.id}
            className="flex items-center gap-4"
          >
            <span
              data-testid="course-ladder-node"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold tabular-nums",
                isInProgress(level.course)
                  ? "border-gold bg-gold text-[color:var(--primary-foreground)] shadow-[0_2px_20px_color-mix(in_oklab,var(--glow)_45%,transparent)]"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {String(level.course.sequence).padStart(2, "0")}
            </span>
            {index < levels.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
          </div>
        ))}
      </div>

      <ol
        aria-label={t("listLabel")}
        data-testid="course-ladder"
        className={cn("grid gap-6", columns)}
      >
        {levels.map((level) => (
          <li key={level.course.id}>
            <CourseLevelCard
              course={level.course}
              leadingModules={level.leadingModules}
              state={isInProgress(level.course) ? "in-progress" : "not-started"}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
