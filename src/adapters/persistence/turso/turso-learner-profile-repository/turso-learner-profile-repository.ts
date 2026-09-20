import type { Database } from "@/adapters/persistence/turso/database/database";
import { learnerProfile } from "@/adapters/persistence/turso/schema/schema";
import {
  LearnerProfile,
  type LearnerAvatar,
} from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";

import { eq } from "drizzle-orm";

type ProfileRow = typeof learnerProfile.$inferSelect;

/**
 * `LearnerProfileRepository` over the `learner_profile` table: one card per
 * learner, replaced by every `set`.
 *
 * @remarks
 * The avatar is stored as two columns — its kind and, for an illustration, its
 * id — and rebuilt through `LearnerProfile` on the way out, so a row carrying
 * an illustration the app no longer ships reads as no profile.
 */
export class TursoLearnerProfileRepository implements LearnerProfileRepository {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async get(): Promise<LearnerProfile | null> {
    const [row] = await this.database
      .select()
      .from(learnerProfile)
      .where(eq(learnerProfile.userId, this.learnerId));
    if (!row) return null;
    const parsed = LearnerProfile.safeParse(profileOf(row));
    return parsed.success ? parsed.data : null;
  }

  async set(profile: LearnerProfile): Promise<void> {
    const columns = columnsOf(profile);
    await this.database
      .insert(learnerProfile)
      .values({ userId: this.learnerId, ...columns })
      .onConflictDoUpdate({
        target: learnerProfile.userId,
        set: { ...columns, updatedAt: new Date() },
      });
  }
}

function profileOf(row: ProfileRow): unknown {
  const avatar =
    row.avatarKind === "illustration"
      ? { kind: "illustration", id: row.avatarIllustrationId }
      : { kind: "initials" };
  return { name: row.name, avatar };
}

function columnsOf({ name, avatar }: LearnerProfile) {
  return {
    name,
    avatarKind: avatar.kind,
    avatarIllustrationId: illustrationIdOf(avatar),
  };
}

function illustrationIdOf(avatar: LearnerAvatar): string | null {
  return avatar.kind === "illustration" ? avatar.id : null;
}
