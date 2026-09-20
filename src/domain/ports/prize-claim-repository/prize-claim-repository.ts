import type { Slug } from "@/domain/entities/slug/slug";

/**
 * Port: the module prizes a learner has claimed on the prize counter.
 *
 * A claimed prize stays claimed for good — the tickets were exchanged for it
 * (capability `learner-achievements`) — so, like tickets, claims only add.
 */
export interface PrizeClaimRepository {
  /** The slug of every module whose prize has been claimed. */
  list(): Promise<ReadonlySet<Slug>>;

  /** Records the claim of one module's prize; idempotent. */
  claim(moduleSlug: Slug): Promise<void>;
}
