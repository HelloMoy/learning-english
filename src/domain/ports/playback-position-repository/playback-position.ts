import { LessonId } from "@/domain/entities/ids/ids";

import { z } from "zod";

/**
 * The playback position for a single lesson. `seconds` is non-negative and
 * finite — `NaN` and `Infinity` are rejected at the boundary so adapters
 * never persist nonsense values.
 *
 * The port (`PlaybackPositionRepository`) keeps its raw-primitive signature
 * because the adapter callsites are 1:1 with `localStorage.setItem`. The
 * value object exists to make the use case signature self-documenting and to
 * validate inputs that flow through the use case boundary.
 */
export const PlaybackPosition = z.object({
  lessonId: LessonId,
  seconds: z.number().finite().nonnegative(),
});

export type PlaybackPosition = z.infer<typeof PlaybackPosition>;
