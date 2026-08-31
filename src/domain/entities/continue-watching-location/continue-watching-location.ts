import { LessonId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";

import { z } from "zod";

/**
 * Where the learner was the last time they opened a lesson.
 *
 * The record is the route triple and nothing else. It deliberately carries no
 * playback seconds — those already live in `PlaybackPositionRepository`, keyed
 * by the same `lessonId` — and no titles, durations or posters: those are
 * resolved from the domain by `findContinueWatching`, so a retitled lesson
 * cannot leave a stale copy behind in storage.
 *
 * `strip` (Zod's default) is load-bearing here: a stored record written by an
 * older build can carry extra keys, and dropping them is the right reading of
 * "this is where you were".
 */
export const ContinueWatchingLocation = z.object({
  courseSlug: Slug,
  moduleSlug: Slug,
  lessonId: LessonId,
});

export type ContinueWatchingLocation = z.infer<typeof ContinueWatchingLocation>;
