import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { COUNT_UP_DURATION_MS, useCountUp } from "./use-count-up";

const emulateReducedMotion = (reduce: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
};

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("WHEN the learner prefers reduced motion THEN the target shows at once", () => {
    emulateReducedMotion(true);
    const target = faker.number.int({ min: 1, max: 155 });

    const { result } = renderHook(() => useCountUp(target));

    expect(result.current).toBe(target);
  });

  test("WHEN the browser cannot report a motion preference THEN the target shows at once", () => {
    vi.stubGlobal("matchMedia", undefined);
    const target = faker.number.int({ min: 1, max: 155 });

    const { result } = renderHook(() => useCountUp(target));

    expect(result.current).toBe(target);
  });

  test("WHEN motion is allowed THEN the count starts at zero AND reaches the target once the duration has passed", () => {
    emulateReducedMotion(false);
    const target = faker.number.int({ min: 10, max: 155 });

    const { result } = renderHook(() => useCountUp(target));
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(COUNT_UP_DURATION_MS / 2);
    });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(target);

    act(() => {
      vi.advanceTimersByTime(COUNT_UP_DURATION_MS);
    });
    expect(result.current).toBe(target);
  });

  test("WHEN the target is zero THEN there is nothing to count", () => {
    emulateReducedMotion(false);

    const { result } = renderHook(() => useCountUp(0));

    expect(result.current).toBe(0);
  });
});
