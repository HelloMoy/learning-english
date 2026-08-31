import { renderHook } from "@testing-library/react";
import { useTheme } from "next-themes";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useLegacyThemeMigration } from "./use-legacy-theme-migration";

/**
 * `next-themes` reads from `localStorage` and a provider context. Mocking the
 * hook directly lets each test hand the migration the exact stored value a
 * real browser would produce, including the legacy one that no longer exists
 * in the app's theme list.
 */
vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

const mockUseTheme = vi.mocked(useTheme);

const withStoredTheme = (theme: string | undefined, setTheme = vi.fn()) => {
  mockUseTheme.mockReturnValue({
    theme,
    setTheme,
    themes: ["dark", "light"],
    resolvedTheme: theme,
    systemTheme: undefined,
  });
  return setTheme;
};

describe("useLegacyThemeMigration", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN storage holds a theme the app no longer recognises", () => {
    test("WHEN mounted THEN it rewrites the stored theme to dark", () => {
      // Arrange — the previous build persisted "system"; next-themes applies
      // no class for a value outside its theme list, so the page would render
      // the light `:root` palette while the toggle reported dark.
      const setTheme = withStoredTheme("system");

      // Act
      renderHook(() => useLegacyThemeMigration());

      // Assert
      expect(setTheme).toHaveBeenCalledWith("dark");
    });

    test("WHEN the stored value is arbitrary THEN it still lands on dark", () => {
      // Arrange — the contract is about the two themes that exist, not about
      // the one legacy value, so a corrupted entry migrates too.
      const setTheme = withStoredTheme("solarized");

      // Act
      renderHook(() => useLegacyThemeMigration());

      // Assert
      expect(setTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("GIVEN a recognised theme", () => {
    test.each(["dark", "light"])("WHEN the stored theme is '%s' THEN it is left alone", (theme) => {
      // Arrange
      const setTheme = withStoredTheme(theme);

      // Act
      renderHook(() => useLegacyThemeMigration());

      // Assert — rewriting a valid choice would clobber the learner's pick.
      expect(setTheme).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the provider has not resolved yet", () => {
    test("WHEN theme is undefined THEN nothing is written", () => {
      // Arrange — `useTheme()` returns undefined on the server and before the
      // provider reads storage. Treating that as unrecognised would overwrite
      // a stored light preference before it had been read.
      const setTheme = withStoredTheme(undefined);

      // Act
      renderHook(() => useLegacyThemeMigration());

      // Assert
      expect(setTheme).not.toHaveBeenCalled();
    });
  });
});
