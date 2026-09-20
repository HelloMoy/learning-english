import type { Database } from "@/adapters/persistence/turso/database/database";
import { prizeClaim } from "@/adapters/persistence/turso/schema/schema";
import { Slug } from "@/domain/entities/slug/slug";
import type { PrizeClaimRepository } from "@/domain/ports/prize-claim-repository/prize-claim-repository";

import { eq } from "drizzle-orm";

/**
 * `PrizeClaimRepository` over the `prize_claim` table, for one learner. A
 * claim is kept for good, so claiming again changes nothing.
 */
export class TursoPrizeClaimRepository implements PrizeClaimRepository {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async list(): Promise<ReadonlySet<Slug>> {
    const rows = await this.database
      .select({ moduleSlug: prizeClaim.moduleSlug })
      .from(prizeClaim)
      .where(eq(prizeClaim.userId, this.learnerId));
    return new Set(rows.flatMap(({ moduleSlug }) => parsedSlug(moduleSlug)));
  }

  async claim(moduleSlug: Slug): Promise<void> {
    await this.database
      .insert(prizeClaim)
      .values({ userId: this.learnerId, moduleSlug })
      .onConflictDoNothing();
  }
}

function parsedSlug(value: string): Slug[] {
  const parsed = Slug.safeParse(value);
  return parsed.success ? [parsed.data] : [];
}
