import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { earnTickets, useEarnedTickets } from "./use-earned-tickets";

const ticketKey = (lessonId: string) => `learning-english:ticket-earned:${lessonId}`;

const announceStorageChange = (key: string | null) => {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("useEarnedTickets", () => {
  test("WHEN no ticket has been earned THEN the snapshot is empty", () => {
    const { result } = renderHook(() => useEarnedTickets());

    expect(result.current.size).toBe(0);
  });

  test("WHEN a ticket is earned THEN the snapshot holds it AND it is stored on the device", () => {
    const { result } = renderHook(() => useEarnedTickets());

    act(() => earnTickets(["lesson-1"]));

    expect(result.current.has("lesson-1")).toBe(true);
    expect(window.localStorage.getItem(ticketKey("lesson-1"))).not.toBeNull();
  });

  test("WHEN several tickets are earned at once THEN every one is stored", () => {
    const { result } = renderHook(() => useEarnedTickets());

    act(() => earnTickets(["lesson-1", "lesson-2", "lesson-3"]));

    expect([...result.current].sort()).toEqual(["lesson-1", "lesson-2", "lesson-3"]);
  });

  test("WHEN a ticket was earned on an earlier visit THEN it is read on mount", () => {
    window.localStorage.setItem(ticketKey("lesson-9"), "1");

    const { result } = renderHook(() => useEarnedTickets());

    expect(result.current.has("lesson-9")).toBe(true);
  });

  test("WHEN nothing new is earned THEN the snapshot keeps its identity", () => {
    // The caller hands the whole catalog over on every render, so a write that
    // changes nothing must not notify — or the render that called it loops.
    const { result } = renderHook(() => useEarnedTickets());
    act(() => earnTickets(["lesson-1"]));
    const afterFirstEarn = result.current;

    act(() => earnTickets(["lesson-1"]));
    act(() => earnTickets([]));

    expect(result.current).toBe(afterFirstEarn);
  });

  test("WHEN another tab earns a ticket THEN the snapshot catches up", () => {
    const { result } = renderHook(() => useEarnedTickets());

    window.localStorage.setItem(ticketKey("lesson-7"), "1");
    announceStorageChange(ticketKey("lesson-7"));

    expect(result.current.has("lesson-7")).toBe(true);
  });

  test("WHEN two surfaces read the tickets THEN they share one snapshot", () => {
    const first = renderHook(() => useEarnedTickets());
    const second = renderHook(() => useEarnedTickets());

    act(() => earnTickets(["lesson-4"]));

    expect(first.result.current).toBe(second.result.current);
  });
});
