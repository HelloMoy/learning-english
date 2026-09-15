"use client";

import type { ModuleLesson } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCompletedLessons } from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { moduleProgress, type ModuleProgress } from "@/lib/module-progress/module-progress";

/**
 * Where the learner stands in one module on this device.
 *
 * @remarks
 * Reads the completion marks and saved playback positions once and hands them
 * to {@link moduleProgress}, where the rules live and are tested. Both stores
 * are empty on the server and before hydration, so the first render always
 * reports `not-started`; a caller that must not assert that before hydration
 * gates on `useIsHydrated`.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @example
 * ```tsx
 * const progress = useModuleProgress(summary.lessons);
 * ```
 *
 * @param lessons - Every lesson of the module, in sequence order
 * @returns The module's progress state
 */
export function useModuleProgress(lessons: ReadonlyArray<ModuleLesson>): ModuleProgress {
  const completedIds = useCompletedLessons();
  const positions = useSavedPlaybackPositions();
  return moduleProgress({ lessons, completedIds, positions });
}
