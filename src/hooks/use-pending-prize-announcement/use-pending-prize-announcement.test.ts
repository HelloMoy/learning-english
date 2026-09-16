import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import {
  announcePrize,
  clearPendingPrize,
  holdPrizeAnnouncement,
  useIsPrizeAnnouncementHeld,
  usePendingPrizeAnnouncement,
} from "./use-pending-prize-announcement";

const STORAGE_KEY = "learning-english:prize-announce";

const announceStorageChange = () => {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  });
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("usePendingPrizeAnnouncement", () => {
  test("WHEN nothing is waiting to be announced THEN there is nothing pending", () => {
    const { result } = renderHook(() => usePendingPrizeAnnouncement());

    expect(result.current).toBeNull();
  });

  test("WHEN a prize is recorded THEN it is pending AND it outlives the page that recorded it", () => {
    const { result } = renderHook(() => usePendingPrizeAnnouncement());

    act(() => announcePrize("2-vowels"));

    expect(result.current).toBe("2-vowels");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("2-vowels");
  });

  test("WHEN a prize was recorded on an earlier page THEN it is read on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "1-introduction");

    const { result } = renderHook(() => usePendingPrizeAnnouncement());

    expect(result.current).toBe("1-introduction");
  });

  test("WHEN the announcement is cleared THEN nothing is pending", () => {
    const { result } = renderHook(() => usePendingPrizeAnnouncement());
    act(() => announcePrize("2-vowels"));

    act(() => clearPendingPrize());

    expect(result.current).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("WHEN another prize is recorded THEN it replaces the one waiting", () => {
    const { result } = renderHook(() => usePendingPrizeAnnouncement());
    act(() => announcePrize("1-introduction"));

    act(() => announcePrize("2-vowels"));

    expect(result.current).toBe("2-vowels");
  });

  test("WHEN another tab records one THEN this one catches up", () => {
    const { result } = renderHook(() => usePendingPrizeAnnouncement());

    window.localStorage.setItem(STORAGE_KEY, "3-consonants");
    announceStorageChange();

    expect(result.current).toBe("3-consonants");
  });

  test("WHEN two surfaces read it THEN they see the same thing", () => {
    const first = renderHook(() => usePendingPrizeAnnouncement());
    const second = renderHook(() => usePendingPrizeAnnouncement());

    act(() => announcePrize("2-vowels"));

    expect(first.result.current).toBe(second.result.current);
  });
});

describe("holdPrizeAnnouncement", () => {
  test("WHEN nobody has claimed the announcement THEN it is not held", () => {
    const { result } = renderHook(() => useIsPrizeAnnouncementHeld());

    expect(result.current).toBe(false);
  });

  test("WHEN the page that won the prize claims the announcement THEN it is held for that page", () => {
    // That page is mid-ticket; announcing over it would talk across the moment.
    const { result } = renderHook(() => useIsPrizeAnnouncementHeld());
    let release = () => {};

    act(() => {
      release = holdPrizeAnnouncement();
    });

    expect(result.current).toBe(true);
    act(() => release());
  });

  test("WHEN that page lets go THEN the announcement is free to be made elsewhere", () => {
    const { result } = renderHook(() => useIsPrizeAnnouncementHeld());
    let release = () => {};
    act(() => {
      release = holdPrizeAnnouncement();
    });

    act(() => release());

    expect(result.current).toBe(false);
  });

  test("WHEN one page takes over from another THEN it stays held until both let go", () => {
    // Leaving a lesson for the next one overlaps the two for a moment.
    const { result } = renderHook(() => useIsPrizeAnnouncementHeld());
    let releaseFirst = () => {};
    let releaseSecond = () => {};
    act(() => {
      releaseFirst = holdPrizeAnnouncement();
      releaseSecond = holdPrizeAnnouncement();
    });

    act(() => releaseFirst());
    expect(result.current).toBe(true);

    act(() => releaseSecond());
    expect(result.current).toBe(false);
  });

  test("WHEN the same page lets go twice THEN it does not free somebody else's hold", () => {
    const { result } = renderHook(() => useIsPrizeAnnouncementHeld());
    let release = () => {};
    let releaseOther = () => {};
    act(() => {
      release = holdPrizeAnnouncement();
      releaseOther = holdPrizeAnnouncement();
    });

    act(() => {
      release();
      release();
    });

    expect(result.current).toBe(true);
    act(() => releaseOther());
  });
});
