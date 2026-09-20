import { Slug } from "@/domain/entities/slug/slug";

import { describe, expect, test } from "vitest";

import { InMemoryPrizeClaimRepository } from "./in-memory-prize-claim-repository";

const vowels = Slug.parse("2-vowels");

describe("InMemoryPrizeClaimRepository", () => {
  test("WHEN nothing has been claimed THEN the set is empty", async () => {
    expect((await new InMemoryPrizeClaimRepository().list()).size).toBe(0);
  });

  test("WHEN a prize is claimed twice THEN it is held once", async () => {
    const claims = new InMemoryPrizeClaimRepository();

    await claims.claim(vowels);
    await claims.claim(vowels);

    expect(await claims.list()).toEqual(new Set([vowels]));
  });
});
