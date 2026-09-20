import { claimPrizeAction } from "@/app/[locale]/learner-actions";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { claimedPrizesServerSnapshot, claimPrize, useClaimedPrizes } from "./use-prize-claims";

beforeEach(() => {
  vi.mocked(claimPrizeAction).mockClear();
  vi.mocked(claimPrizeAction).mockResolvedValue({ data: { claimed: true } } as never);
});

describe("useClaimedPrizes", () => {
  test("WHEN nothing has been claimed THEN no prize reads as claimed", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    expect(result.current.size).toBe(0);
  });

  test("WHEN a prize is claimed THEN the snapshot holds it AND it is saved for the learner", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("2-vowels"));

    expect(result.current.has("2-vowels")).toBe(true);
    expect(claimPrizeAction).toHaveBeenCalledWith({ moduleSlug: "2-vowels" });
  });

  test("WHEN the learner's snapshot carries a claim THEN it is read", () => {
    givenLearner.claimedPrizes(["1-introduction"]);

    const { result } = renderHook(() => useClaimedPrizes());

    expect(result.current.has("1-introduction")).toBe(true);
  });

  test("WHEN one module is claimed THEN another module stays unclaimed", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("2-vowels"));

    expect(result.current.has("3-consonants")).toBe(false);
  });

  test("WHEN the same prize is claimed twice THEN it is saved once", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("2-vowels"));
    const afterFirstClaim = result.current;
    act(() => claimPrize("2-vowels"));

    expect(result.current).toBe(afterFirstClaim);
    expect(claimPrizeAction).toHaveBeenCalledTimes(1);
  });

  test("WHEN the server refuses THEN the prize reads as ready again", async () => {
    vi.mocked(claimPrizeAction).mockResolvedValue({ serverError: "x" } as never);

    act(() => claimPrize("2-vowels"));

    await waitFor(() => expect(learnerStore.getState().claimedPrizes.has("2-vowels")).toBe(false));
  });

  test("WHEN two surfaces read the claims THEN they share one snapshot", () => {
    const first = renderHook(() => useClaimedPrizes());
    const second = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("4-rhythm"));

    expect(first.result.current).toBe(second.result.current);
  });

  test("WHEN rendering on the server THEN the snapshot is empty and stable", () => {
    expect(claimedPrizesServerSnapshot().size).toBe(0);
    expect(claimedPrizesServerSnapshot()).toBe(claimedPrizesServerSnapshot());
  });
});
