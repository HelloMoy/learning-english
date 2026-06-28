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

const mockUseTheme = vi.mocked(useTheme);

describe("ThemeToggle", () => {
  beforeEach(() => {
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
