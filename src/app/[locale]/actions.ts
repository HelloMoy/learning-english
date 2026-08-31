"use server";

import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { lessonPath } from "@/i18n/lesson-routes";
import { actionClient } from "@/lib/safe-action/safe-action";

/**
 * What the home's "Continue watching" panel renders.
 *
 * Entities do not cross this boundary: the panel needs three strings, a
 * locale-relative href and — only for a video — a duration to size its
 * progress bar against. Sending whole entities would ship the lesson body
 * and every field the panel ignores to the browser.
 *
 * `durationSeconds` is `null` for a reading lesson, which is the panel's
 * signal to omit the progress indicator rather than draw it at zero.
 */
export type ContinueWatchingPanel = {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonHref: string;
  durationSeconds: number | null;
};

/**
 * Server Action invoked by the home's `ContinueWatching` component with the
 * location it read from `localStorage`.
 *
 * The client holds identity — a course slug, a module slug and a lesson id —
 * and the domain owns everything else, so a retitled lesson shows its new
 * title without any stored copy going stale.
 *
 * A location that no longer resolves returns `data: null`, not an error.
 * Lessons get renamed, moved and removed while a device still holds a record
 * pointing at them; that is an ordinary outcome, and the home's answer to it
 * is to render nothing. Reserving `validationErrors` for genuinely malformed
 * input keeps the two distinguishable.
 *
 * @returns `{ data: ContinueWatchingPanel | null }`; `validationErrors` when
 *          the stored location does not satisfy the schema
 */
export const findContinueWatchingAction = actionClient
  .inputSchema(ContinueWatchingLocation)
  .action(async ({ parsedInput }): Promise<ContinueWatchingPanel | null> => {
    const deps = getCoursePlatformDeps();
    const result = await deps.useCases.findContinueWatching(parsedInput);
    if (result.isErr()) {
      return null;
    }

    const { course, module, lesson } = result.value;
    return {
      courseTitle: course.title,
      moduleTitle: module.title,
      lessonTitle: lesson.title,
      lessonHref: lessonPath(course, module, lesson),
      durationSeconds: lesson.kind === "video" ? lesson.durationSeconds : null,
    };
  });
