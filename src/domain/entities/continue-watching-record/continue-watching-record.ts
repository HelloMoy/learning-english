import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";

import { z } from "zod";

/**
 * A course's resume location together with when the learner was last there.
 *
 * @remarks
 * `watchedAt` is epoch milliseconds read from storage — data the domain
 * receives, never a clock it reads. It exists so callers can order courses by
 * the last one watched and say how long ago that was.
 */
export const ContinueWatchingRecord = z.object({
  location: ContinueWatchingLocation,
  watchedAt: z.number().int().nonnegative(),
});

export type ContinueWatchingRecord = z.infer<typeof ContinueWatchingRecord>;
