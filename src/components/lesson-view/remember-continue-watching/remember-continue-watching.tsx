"use client";

import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import { useContinueWatching } from "@/hooks/use-continue-watching/use-continue-watching";

import { useEffect } from "react";

/**
 * Records where the learner is, so the home can offer to bring them back.
 *
 * @remarks
 * Renders nothing. It exists because the Lesson Page is a Server Component
 * and the record lives in `localStorage`: this is the smallest possible
 * client island around that one write.
 *
 * It records on **mount**, for lessons of every kind, rather than on the
 * first `play`. A reading lesson has no playback to hook, and a learner who
 * opened a lesson and read half of it was, in the plain sense of the phrase,
 * there last. Recording a visit is also what keeps the home's panel honest
 * for a video the learner opened but did not start: the panel shows the
 * lesson and omits the progress bar, which is exactly the truth.
 *
 * Slugs and the id arrive as plain strings from the route and are validated
 * by `ContinueWatchingLocation` inside the hook, so a segment that failed to
 * parse upstream writes nothing rather than storing a location that can never
 * resolve. A rejected write is swallowed for the same reason the sibling
 * playback and completion adapters swallow theirs — failing to remember where
 * the learner was must never break the lesson they are on.
 *
 * @param continueWatching - Overrides the storage adapter; tests inject a fake
 */
export function RememberContinueWatching({
  courseSlug,
  moduleSlug,
  lessonId,
  continueWatching,
}: {
  courseSlug: string;
  moduleSlug: string;
  lessonId: string;
  continueWatching?: ContinueWatchingRepository;
}) {
  const locations = useContinueWatching(continueWatching);

  useEffect(() => {
    // The promise is deliberately unobserved: there is no UI to update on
    // either outcome, and the hook already reports a rejected value as
    // `false` rather than throwing.
    void locations.set({ courseSlug, moduleSlug, lessonId }).catch(() => {});
  }, [locations, courseSlug, moduleSlug, lessonId]);

  return null;
}
