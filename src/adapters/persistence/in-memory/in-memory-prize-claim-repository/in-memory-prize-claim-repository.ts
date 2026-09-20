import type { Slug } from "@/domain/entities/slug/slug";
import type { PrizeClaimRepository } from "@/domain/ports/prize-claim-repository/prize-claim-repository";

/**
 * In-memory `PrizeClaimRepository`, for use-case tests and stories.
 */
export class InMemoryPrizeClaimRepository implements PrizeClaimRepository {
  readonly #claimed: Set<Slug>;

  constructor(initial: Iterable<Slug> = []) {
    this.#claimed = new Set(initial);
  }

  list(): Promise<ReadonlySet<Slug>> {
    return Promise.resolve(new Set(this.#claimed));
  }

  claim(moduleSlug: Slug): Promise<void> {
    this.#claimed.add(moduleSlug);
    return Promise.resolve();
  }
}
