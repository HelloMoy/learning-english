"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { useContinueWatching } from "@/hooks/use-continue-watching/use-continue-watching";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import {
  deriveModuleRoute,
  type LearnerProgress,
  type ModuleRoute,
  type RouteLesson,
} from "@/lib/module-route/module-route";

import { useEffect, useState } from "react";

/**
 * The learner's route through a module, or the fact that it cannot be known yet.
 *
 * `isRead: false` means the browser has not read stored progress and the
 * continue-watching record yet — the server render and the first client frame.
 * It is not the same as "nothing watched", which is `isRead: true` with no
 * finished steps.
 */
export type ModuleRouteReading = { isRead: false } | { isRead: true; route: ModuleRoute };

type LastOpenedReading = { isRead: false } | { isRead: true; lessonId?: LessonId };

const NOT_READ = { isRead: false } as const;

/**
 * Reads the learner's progress through a module as a route.
 *
 * @remarks
 * Completion, playback position and the continue-watching record live in
 * `localStorage`, which the server cannot read. The record is read through an
 * asynchronous port, so the hook reports `isRead: false` until it arrives: the
 * featured lesson depends on it, and deriving the route from progress alone
 * first would feature one lesson and then move to another. The initial state
 * matches the server render, so hydration never sees a mismatch.
 *
 * A missing or unreadable record reads as "no lesson opened last", and the
 * route falls back to the furthest progress. Once read, the route re-derives
 * whenever the completion or playback store changes.
 *
 * @example
 * ```tsx
 * const reading = useModuleRoute(lessons);
 * if (!reading.isRead) return <RouteWithoutProgress lessons={lessons} />;
 * return <Route steps={reading.route.steps} />;
 * ```
 *
 * @param lessons - The module's lessons with their runtimes
 * @returns The route once progress and the record are read, otherwise `{ isRead: false }`
 */
export function useModuleRoute(lessons: ReadonlyArray<RouteLesson>): ModuleRouteReading {
  const completedLessonIds = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  const lastOpened = useLastOpenedLesson();

  if (!lastOpened.isRead) return NOT_READ;

  const progress: LearnerProgress = {
    completedLessonIds,
    positions,
    ...(lastOpened.lessonId ? { lastOpenedLessonId: lastOpened.lessonId } : {}),
  };
  return { isRead: true, route: deriveModuleRoute(lessons, progress) };
}

function useLastOpenedLesson(): LastOpenedReading {
  const locations = useContinueWatching();
  const [lastOpened, setLastOpened] = useState<LastOpenedReading>(NOT_READ);

  useEffect(() => {
    let isMounted = true;
    locations.get().then(
      (location) => {
        if (isMounted)
          setLastOpened({ isRead: true, ...(location ? { lessonId: location.lessonId } : {}) });
      },
      () => {
        if (isMounted) setLastOpened({ isRead: true });
      },
    );
    return () => {
      isMounted = false;
    };
  }, [locations]);

  return lastOpened;
}
