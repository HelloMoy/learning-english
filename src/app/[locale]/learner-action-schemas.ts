import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { LessonId } from "@/domain/entities/ids/ids";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { Slug } from "@/domain/entities/slug/slug";
import { PlaybackPosition } from "@/domain/ports/playback-position-repository/playback-position";

import { z } from "zod";

/**
 * The input of every learner action, by action. None carries a learner or
 * user id: the learner is whoever the session says, never what the client
 * claims. Kept apart from `learner-actions.ts` because a `"use server"`
 * module may only export async functions.
 */
export const LEARNER_ACTION_SCHEMAS = {
  lessonCompletion: z.object({ lessonId: LessonId }),
  playbackPosition: PlaybackPosition,
  continueWatching: ContinueWatchingLocation,
  learnerProfile: LearnerProfile,
  earnedTickets: z.object({ lessonIds: z.array(LessonId) }),
  prizeClaim: z.object({ moduleSlug: Slug }),
};
