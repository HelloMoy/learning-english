import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("ThemeToggle", () => {
  beforeEach(() => {
    isHydrated = true;
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      resolvedTheme: "light",
      systemTheme: undefined,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN the theme is loaded (mounted, not undefined)", () => {
    test("WHEN rendered THEN the toggle displays the current theme's label", () => {
      // Arrange
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        resolvedTheme: "dark",
        systemTheme: undefined,
      });

      // Act
      render(<ThemeToggle />);

      // Assert
      expect(screen.getByRole("button", { name: /Dark/i })).toBeInTheDocument();
    });
  });

  describe("GIVEN the toggle must survive its label being hidden on a phone", () => {
    test("WHEN rendered THEN its accessible name comes from aria-label, not from the visible text", () => {
      // Arrange — the theme name is hidden below `sm` so the chip fits the
      // header's width budget at 320px. If the name were derived from the
      // visible text instead, hiding it would leave the button unnamed.
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        resolvedTheme: "dark",
        systemTheme: undefined,
      });

      // Act
      render(<ThemeToggle />);

      // Assert
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "label: dark");
    });

    test("WHEN rendered THEN the theme name is still in the DOM for wider viewports", () => {
      // Arrange
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        resolvedTheme: "dark",
        systemTheme: undefined,
      });

      // Act
      render(<ThemeToggle />);

      // Assert — which viewport reveals it is a CSS concern jsdom cannot
      // resolve; that the text exists to be revealed is the part worth fixing.
      expect(screen.getByRole("button")).toHaveTextContent("dark");
    });

    test("WHEN the pre-hydration placeholder renders THEN it is named too", () => {
      // Arrange
      isHydrated = false;
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        resolvedTheme: "dark",
        systemTheme: undefined,
      });

      // Act
      render(<ThemeToggle />);

      // Assert — the placeholder shows only "…", so without its own
      // aria-label it would be an unnamed button in the server HTML.
      expect(screen.getByRole("button", { name: "label" })).toBeInTheDocument();
    });
  });

  describe("GIVEN the theme is not yet resolved (theme === undefined, pre-mount)", () => {
    test("WHEN rendered THEN a disabled placeholder is shown", () => {
      // Arrange
      mockUseTheme.mockReturnValue({
        theme: undefined,
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        resolvedTheme: undefined,
        systemTheme: undefined,
      });

      // Act
      render(<ThemeToggle />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("…");
    });
  });

  describe("GIVEN React has not finished hydrating yet", () => {
    test("WHEN rendered with a resolved theme THEN the placeholder still wins", async () => {
      // Arrange — `next-themes` has already read localStorage on the client,
      // but the server HTML shows the placeholder. Emitting the real button
      // during hydration is the mismatch this guard prevents.
      isHydrated = false;
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        resolvedTheme: "dark",
        systemTheme: undefined,
      });

      // Act
      render(<ThemeToggle />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("…");
    });
  });

  describe("GIVEN the current theme is 'light'", () => {
    test("WHEN the user clicks the toggle THEN setTheme is called with 'dark'", async () => {
      // Arrange
      const user = userEvent.setup();
      const setTheme = vi.fn();
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme,
        themes: ["light", "dark", "system"],
        resolvedTheme: "light",
        systemTheme: undefined,
      });
      render(<ThemeToggle />);

      // Act
      await user.click(screen.getByRole("button", { name: /Light/i }));

      // Assert
      expect(setTheme).toHaveBeenCalledWith("dark");
    });
  });

  describe("GIVEN the current theme is 'dark'", () => {
    test("WHEN the user clicks the toggle THEN setTheme is called with 'system'", async () => {
      // Arrange
      const user = userEvent.setup();
      const setTheme = vi.fn();
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme,
        themes: ["light", "dark", "system"],
        resolvedTheme: "dark",
        systemTheme: undefined,
      });
      render(<ThemeToggle />);

      // Act
      await user.click(screen.getByRole("button", { name: /Dark/i }));

      // Assert
      expect(setTheme).toHaveBeenCalledWith("system");
    });
  });

  describe("GIVEN the current theme is 'system'", () => {
    test("WHEN the user clicks the toggle THEN setTheme is called with 'light' (cycle wraps)", async () => {
      // Arrange
      const user = userEvent.setup();
      const setTheme = vi.fn();
      mockUseTheme.mockReturnValue({
        theme: "system",
        setTheme,
        themes: ["light", "dark", "system"],
        resolvedTheme: undefined,
        systemTheme: "light",
      });
      render(<ThemeToggle />);

      // Act
      await user.click(screen.getByRole("button", { name: /System/i }));

      // Assert
      expect(setTheme).toHaveBeenCalledWith("light");
    });
  });

  describe("GIVEN a randomized theme label", () => {
    test("WHEN rendered THEN the button reflects the resolved theme label", () => {
      // Arrange — randomly pick one of the three themes for fuzz coverage
      const theme = faker.helpers.arrayElement(["light", "dark", "system"] as const);
      mockUseTheme.mockReturnValue({
        theme,
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        resolvedTheme: theme === "system" ? "light" : theme,
        systemTheme: undefined,
      });

      // Act
      render(<ThemeToggle />);

      // Assert
      const expectedLabel = theme.charAt(0).toUpperCase() + theme.slice(1);
      expect(
        screen.getByRole("button", { name: new RegExp(expectedLabel, "i") }),
      ).toBeInTheDocument();
    });
  });
});
