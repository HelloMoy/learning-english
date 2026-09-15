"use client";

import { ModuleProgressPanel } from "@/components/module-progress-panel/module-progress-panel";
import { ModuleRouteStep } from "@/components/module-route-step/module-route-step";
import type { Course } from "@/domain/entities/course/course";
import type { Lesson } from "@/domain/entities/lesson/lesson";
import type { Module } from "@/domain/entities/module/module";
import { useModuleRoute, type ModuleRouteReading } from "@/hooks/use-module-route/use-module-route";
import { lessonPath } from "@/i18n/lesson-routes";
import type { RouteLesson, RouteStep } from "@/lib/module-route/module-route";

/** Props for {@link ModuleRoute}. */
export type ModuleRouteProps = {
  course: Course;
  module: Module;
  /** The module's lessons, in sequence order. */
  lessons: ReadonlyArray<Lesson>;
};

const NOT_STARTED: Pick<RouteStep, "state" | "watchedFraction"> = {
  state: "upcoming",
  watchedFraction: 0,
};

/**
 * The learner's route through a module: the progress panel and one step per
 * lesson, each showing whether it is finished, current or upcoming.
 *
 * @remarks
 * A client component because progress lives in `localStorage`. It reads that
 * progress once, through `useModuleRoute`, and hands the same reading to the
 * panel and to every step, so the count in the panel and the steps on the
 * route can never disagree.
 *
 * Until progress is read, every step renders as upcoming and the panel shows
 * no figures — the server-rendered frame asserts nothing about the learner.
 *
 * The panel comes first in the DOM, so its figures are read before the list at
 * every width; from `lg` it moves to a sticky right-hand column.
 *
 * @example
 * ```tsx
 * <ModuleRoute course={course} module={module} lessons={lessons} />
 * ```
 *
 * @param props - {@link ModuleRouteProps}
 */
export function ModuleRoute({ course, module, lessons }: ModuleRouteProps) {
  const reading = useModuleRoute(lessons.map(toRouteLesson));

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:order-last">
        <ModuleProgressPanel reading={reading} />
      </div>
      <ol className="flex min-w-0 flex-col">
        {lessons.map((lesson) => {
          const { state, watchedFraction } = stepFor(reading, lesson);
          return (
            <li key={lesson.id}>
              <ModuleRouteStep
                lesson={lesson}
                href={lessonPath(course, module, lesson)}
                state={state}
                watchedFraction={watchedFraction}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function toRouteLesson(lesson: Lesson): RouteLesson {
  return {
    id: lesson.id,
    sequence: lesson.sequence,
    durationSeconds: lesson.kind === "video" ? lesson.durationSeconds : 0,
  };
}

function stepFor(
  reading: ModuleRouteReading,
  lesson: Lesson,
): Pick<RouteStep, "state" | "watchedFraction"> {
  if (!reading.isRead) return NOT_STARTED;
  return reading.route.steps.find((step) => step.lessonId === lesson.id) ?? NOT_STARTED;
}
