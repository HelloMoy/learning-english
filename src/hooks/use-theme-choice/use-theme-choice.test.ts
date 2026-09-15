import { act, renderHook } from "@testing-library/react";
import { useTheme } from "next-themes";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { THEME_SWITCH_MS, useThemeChoice } from "./use-theme-choice";

vi.mock("next-themes", () => ({ useTheme: vi.fn() }));

const setTheme = vi.fn();

const storing = (theme: string | undefined) =>
  vi.mocked(useTheme).mockReturnValue({ theme, setTheme } as never);

/** A `matchMedia` answering the reduced-motion query, and nothing else. */
const preferringReducedMotion = (matches: boolean) =>
  vi
    .spyOn(window, "matchMedia")
    .mockImplementation(
      (query: string) =>
        ({ matches: matches && query.includes("prefers-reduced-motion"), media: query }) as never,
    );

beforeEach(() => {
  vi.useFakeTimers();
  setTheme.mockClear();
  preferringReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThemeChoice", () => {
  test("WHEN the provider has not read storage THEN there is no choice to offer yet", () => {
    storing(undefined);

    const { result } = renderHook(() => useThemeChoice());

    expect(result.current).toBeNull();
  });

  test("WHEN light is stored THEN light is current", () => {
    storing("light");

    const { result } = renderHook(() => useThemeChoice());

    expect(result.current?.currentTheme).toBe("light");
  });

  test("WHEN a legacy or unknown value is stored THEN dark is current", () => {
    storing("system");

    const { result } = renderHook(() => useThemeChoice());

    expect(result.current?.currentTheme).toBe("dark");
  });

  describe("GIVEN a learner toggles the theme", () => {
    test("WHEN toggled THEN the shown theme flips at once and the theme applies after the slide", () => {
      storing("light");
      const { result } = renderHook(() => useThemeChoice());

      act(() => result.current?.toggle());

      expect(result.current?.currentTheme).toBe("dark");
      expect(setTheme).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(THEME_SWITCH_MS));

      expect(setTheme).toHaveBeenCalledWith("dark");
    });

    test("WHEN a stored legacy value is toggled THEN light is applied, never a third theme", () => {
      storing("system");
      const { result } = renderHook(() => useThemeChoice());

      act(() => result.current?.toggle());
      act(() => vi.advanceTimersByTime(THEME_SWITCH_MS));

      expect(setTheme).toHaveBeenCalledWith("light");
      expect(setTheme).not.toHaveBeenCalledWith("system");
    });

    test("WHEN reduced motion is preferred THEN the theme applies immediately", () => {
      preferringReducedMotion(true);
      storing("dark");
      const { result } = renderHook(() => useThemeChoice());

      act(() => result.current?.toggle());

      expect(setTheme).toHaveBeenCalledWith("light");
    });

    test("WHEN the control unmounts mid-slide THEN the theme is still applied", () => {
      storing("dark");
      const { result, unmount } = renderHook(() => useThemeChoice());

      act(() => result.current?.toggle());
      unmount();
      act(() => vi.advanceTimersByTime(THEME_SWITCH_MS));

      // A learner who toggled and then navigated still asked for the other theme.
      expect(setTheme).toHaveBeenCalledWith("light");
    });
  });
});
