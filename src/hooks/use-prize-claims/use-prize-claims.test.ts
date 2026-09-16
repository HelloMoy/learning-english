import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { claimPrize, useClaimedPrizes } from "./use-prize-claims";

const claimKey = (moduleSlug: string) => `learning-english:prize-claimed:${moduleSlug}`;

const announceStorageChange = (key: string | null) => {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("useClaimedPrizes", () => {
  test("WHEN nothing has been claimed THEN no prize reads as claimed", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    expect(result.current.size).toBe(0);
  });

  test("WHEN a prize is claimed THEN the snapshot holds it AND it is stored on the device", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("2-vowels"));

    expect(result.current.has("2-vowels")).toBe(true);
    expect(window.localStorage.getItem(claimKey("2-vowels"))).not.toBeNull();
  });

  test("WHEN a claim was stored on an earlier visit THEN it is read on mount", () => {
    window.localStorage.setItem(claimKey("1-introduction"), "1");

    const { result } = renderHook(() => useClaimedPrizes());

    expect(result.current.has("1-introduction")).toBe(true);
  });

  test("WHEN one module is claimed THEN another module stays unclaimed", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("2-vowels"));

    expect(result.current.has("3-consonants")).toBe(false);
  });

  test("WHEN another tab claims a prize THEN the snapshot catches up", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    window.localStorage.setItem(claimKey("3-consonants"), "1");
    announceStorageChange(claimKey("3-consonants"));

    expect(result.current.has("3-consonants")).toBe(true);
  });

  test("WHEN the same prize is claimed twice THEN it stays claimed once", () => {
    const { result } = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("2-vowels"));
    act(() => claimPrize("2-vowels"));

    expect([...result.current]).toEqual(["2-vowels"]);
  });

  test("WHEN two surfaces read the claims THEN they share one snapshot", () => {
    const first = renderHook(() => useClaimedPrizes());
    const second = renderHook(() => useClaimedPrizes());

    act(() => claimPrize("4-key-sound-patterns-and-features"));

    expect(first.result.current).toBe(second.result.current);
  });
});
