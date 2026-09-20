import type { Database } from "@/adapters/persistence/turso/database/database";
import { playbackPosition } from "@/adapters/persistence/turso/schema/schema";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

import { and, eq } from "drizzle-orm";

/**
 * `PlaybackPositionRepository` over the `playback_position` table, for one
 * learner: one row per lesson, replaced on every save.
 *
 * @example
 * ```ts
 * const positions = new TursoPlaybackPositionRepository(database, session.user.id);
 * await positions.setPosition(lessonId, 93.4);
 * ```
 */
export class TursoPlaybackPositionRepository implements PlaybackPositionRepository {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async getPosition(lessonId: LessonId): Promise<number | null> {
    const [row] = await this.database
      .select({ seconds: playbackPosition.seconds })
      .from(playbackPosition)
      .where(
        and(eq(playbackPosition.userId, this.learnerId), eq(playbackPosition.lessonId, lessonId)),
      );
    return row?.seconds ?? null;
  }

  async setPosition(lessonId: LessonId, seconds: number): Promise<void> {
    await this.database
      .insert(playbackPosition)
      .values({ userId: this.learnerId, lessonId, seconds })
      .onConflictDoUpdate({
        target: [playbackPosition.userId, playbackPosition.lessonId],
        set: { seconds, updatedAt: new Date() },
      });
  }
}
