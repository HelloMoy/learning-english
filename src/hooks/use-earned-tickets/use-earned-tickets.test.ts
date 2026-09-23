import { earnTicketsAction } from "@/app/[locale]/learner-actions";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { earnedTicketsServerSnapshot, earnTickets, useEarnedTickets } from "./use-earned-tickets";

beforeEach(() => {
  vi.mocked(earnTicketsAction).mockClear();
  vi.mocked(earnTicketsAction).mockResolvedValue({ data: { earned: true } } as never);
});

describe("useEarnedTickets", () => {
  test("WHEN no ticket has been earned THEN the snapshot is empty", () => {
    const { result } = renderHook(() => useEarnedTickets());

    expect(result.current.size).toBe(0);
  });

  test("WHEN a ticket is earned THEN the snapshot holds it AND it is saved for the learner", () => {
    const { result } = renderHook(() => useEarnedTickets());

    act(() => earnTickets(["lesson-1"]));

    expect(result.current.has("lesson-1")).toBe(true);
    expect(earnTicketsAction).toHaveBeenCalledWith({ lessonIds: ["lesson-1"] });
  });

  test("WHEN several tickets are earned at once THEN one save carries them all", () => {
    const { result } = renderHook(() => useEarnedTickets());

    act(() => earnTickets(["lesson-1", "lesson-2", "lesson-3"]));

    expect([...result.current].sort()).toEqual(["lesson-1", "lesson-2", "lesson-3"]);
    expect(earnTicketsAction).toHaveBeenCalledTimes(1);
  });

  test("WHEN the learner's snapshot carries tickets THEN they are read", () => {
    givenLearner.earnedTickets(["lesson-9"]);

    const { result } = renderHook(() => useEarnedTickets());

    expect(result.current.has("lesson-9")).toBe(true);
  });

  test("WHEN nothing new is earned THEN nothing is sent and the snapshot keeps its identity", () => {
    // The caller hands the whole catalog over on every render, so a write that
    // changes nothing must not notify — or the render that called it loops.
    const { result } = renderHook(() => useEarnedTickets());
    act(() => earnTickets(["lesson-1"]));
    const afterFirstEarn = result.current;

    act(() => earnTickets(["lesson-1"]));
    act(() => earnTickets([]));

    expect(result.current).toBe(afterFirstEarn);
    expect(earnTicketsAction).toHaveBeenCalledTimes(1);
  });

  test("WHEN the server refuses THEN the tickets are withdrawn", async () => {
    vi.mocked(earnTicketsAction).mockResolvedValue({ serverError: "x" } as never);

    act(() => earnTickets(["lesson-5"]));

    await waitFor(() => expect(learnerStore.getState().earnedTickets.has("lesson-5")).toBe(false));
  });

  test("WHEN two surfaces read the tickets THEN they share one snapshot", () => {
    const first = renderHook(() => useEarnedTickets());
    const second = renderHook(() => useEarnedTickets());

    act(() => earnTickets(["lesson-4"]));

    expect(first.result.current).toBe(second.result.current);
  });

  test("WHEN rendering on the server THEN the snapshot is empty and stable", () => {
    expect(earnedTicketsServerSnapshot().size).toBe(0);
    expect(earnedTicketsServerSnapshot()).toBe(earnedTicketsServerSnapshot());
  });
});
