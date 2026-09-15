import { THEME_SWITCH_MS } from "@/hooks/use-theme-choice/use-theme-choice";

import { faker } from "@faker-js/faker";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useTheme } from "next-themes";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

/**
 * `next-themes` reads from `localStorage` and a `<ThemeProvider>` context;
 * `next-intl` requires `<NextIntlClientProvider>`. Both are awkward to set
 * up in a unit test, so we mock the hooks directly and control their
 * return values per test.
 */
vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

vi.mock("next-intl", () => ({
  // Returns the key itself as the label — enough to assert "the right label is rendered"
  // without coupling the test to actual translated strings.
  useTranslations: () => (key: string) => key,
}));

/**
 * Hydration state is a module-level flag rather than a `vi.doMock`: the
 * component is imported statically here, so a late mock would never reach
 * it. Tests flip this and `beforeEach` restores the hydrated default.
 */
let isHydrated = true;

vi.mock("@/hooks/use-is-hydrated/use-is-hydrated", () => ({
  useIsHydrated: () => isHydrated,
}));

const mockUseTheme = vi.mocked(useTheme);

/** The only two themes the app recognises. `system` is deliberately absent. */
const THEMES = ["dark", "light"] as const;

const storing = (theme: string | undefined, setTheme = vi.fn()) => {
  mockUseTheme.mockReturnValue({
    theme,
    setTheme,
    themes: [...THEMES],
    resolvedTheme: theme,
    systemTheme: undefined,
  });
  return setTheme;
};

/**
 * Clicks go through `fireEvent`: the slide delay runs on Vitest's fake clock,
 * and user-event's own internal waits stall against it. The switch is a native
 * button, so a click event is all its behaviour needs.
 */
describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    isHydrated = true;
    storing("light");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("GIVEN the theme is loaded", () => {
    test("WHEN dark is active THEN a checked switch names the dark theme", () => {
      storing("dark");

      render(<ThemeToggle />);

      expect(screen.getByRole("switch", { name: "label: dark" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    test("WHEN light is active THEN an unchecked switch names the light theme", () => {
      storing("light");

      render(<ThemeToggle />);

      expect(screen.getByRole("switch", { name: "label: light" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });
  });

  describe("GIVEN the toggle must survive its label being hidden on a phone", () => {
    test("WHEN rendered THEN its accessible name comes from aria-label, not from the visible text", () => {
      // The theme name is hidden below `sm` so the control fits the header's
      // width budget at 320px. If the name were derived from the visible text
      // instead, hiding it would leave the switch unnamed.
      storing("dark");

      render(<ThemeToggle />);

      expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "label: dark");
    });

    test("WHEN rendered THEN the theme name is still in the DOM for wider viewports", () => {
      storing("dark");

      render(<ThemeToggle />);

      // Which viewport reveals it is a CSS concern jsdom cannot resolve; that
      // the text exists to be revealed is the part worth fixing.
      expect(screen.getByRole("switch")).toHaveTextContent("dark");
    });
  });

  describe("GIVEN the theme cannot be shown yet", () => {
    test("WHEN React has not finished hydrating THEN a named, disabled placeholder renders instead of the switch", () => {
      // `next-themes` has already read localStorage on the client, but the
      // server HTML shows the placeholder. Emitting the real switch during
      // hydration is the mismatch this guard prevents.
      isHydrated = false;
      storing("dark");

      render(<ThemeToggle />);

      expect(screen.getByRole("button", { name: "label" })).toBeDisabled();
      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    });

    test("WHEN the theme is not resolved THEN the placeholder renders", () => {
      storing(undefined);

      render(<ThemeToggle />);

      expect(screen.getByRole("button", { name: "label" })).toBeDisabled();
    });
  });

  describe("GIVEN the current theme is 'dark'", () => {
    test("WHEN the switch is pressed THEN the thumb moves at once and light applies after the slide", () => {
      const setTheme = storing("dark");
      render(<ThemeToggle />);

      fireEvent.click(screen.getByRole("switch", { name: "label: dark" }));

      expect(screen.getByRole("switch", { name: "label: light" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
      act(() => vi.advanceTimersByTime(THEME_SWITCH_MS));
      expect(setTheme).toHaveBeenCalledWith("light");
    });
  });

  describe("GIVEN the current theme is 'light'", () => {
    test("WHEN the switch is pressed THEN dark applies after the slide", () => {
      const setTheme = storing("light");
      render(<ThemeToggle />);

      fireEvent.click(screen.getByRole("switch", { name: "label: light" }));
      act(() => vi.advanceTimersByTime(THEME_SWITCH_MS));

      expect(setTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("GIVEN the toggle is binary", () => {
    test.each(THEMES)(
      "WHEN the switch is pressed from '%s' THEN setTheme is never called with 'system'",
      (theme) => {
        // The guard that the third state is gone rather than merely unreachable
        // by the one path the tests above happen to walk.
        const setTheme = storing(theme);
        render(<ThemeToggle />);

        fireEvent.click(screen.getByRole("switch"));
        act(() => vi.advanceTimersByTime(THEME_SWITCH_MS));

        expect(setTheme).not.toHaveBeenCalledWith("system");
      },
    );
  });

  describe("GIVEN a returning learner whose storage still holds 'system'", () => {
    test("WHEN rendered THEN the switch reports dark, the new default", () => {
      // The previous build wrote "system" to real browsers, so this is what
      // `useTheme()` hands the component on their next visit.
      storing("system");

      render(<ThemeToggle />);

      expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "label: dark");
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });

    test("WHEN the switch is pressed THEN setTheme is called with 'light'", () => {
      const setTheme = storing("system");
      render(<ThemeToggle />);

      fireEvent.click(screen.getByRole("switch"));
      act(() => vi.advanceTimersByTime(THEME_SWITCH_MS));

      // Having resolved to dark, one press moves them to light.
      expect(setTheme).toHaveBeenCalledWith("light");
    });
  });

  describe("GIVEN a randomized theme", () => {
    test("WHEN rendered THEN the switch names the resolved theme", () => {
      const theme = faker.helpers.arrayElement(THEMES);
      storing(theme);

      render(<ThemeToggle />);

      expect(screen.getByRole("switch", { name: `label: ${theme}` })).toBeInTheDocument();
    });
  });
});
