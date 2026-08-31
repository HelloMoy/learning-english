import { usePathname, useRouter } from "@/i18n/navigation";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocale, useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LocaleSwitcher } from "./locale-switcher";

/**
 * Mock the next-intl + next/navigation hooks directly. Setting up real
 * providers for these in a unit test adds noise — the component logic
 * itself is what we're verifying.
 *
 * The control is a menu-backed button, not a `<select>`: it is queried as a
 * `button` and its options as `menuitemradio`. The previous `combobox`
 * queries went with the native element (see the change's design, Risks).
 */
vi.mock("next-intl", () => ({
  useLocale: vi.fn(),
  useTranslations: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

const mockUseLocale = vi.mocked(useLocale);
const mockUseTranslations = vi.mocked(useTranslations);
const mockUsePathname = vi.mocked(usePathname);
const mockUseRouter = vi.mocked(useRouter);

const routerWith = (replace: () => void) =>
  ({
    replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }) as never;

/** Open the menu and hand back the trigger, which role queries cannot reach once Radix hides the background. */
const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  const trigger = screen.getByRole("button", { name: /label/i });
  await user.click(trigger);
  return trigger;
};

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    mockUseLocale.mockReturnValue("en");
    // Echo the key so assertions stay decoupled from real translated copy.
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
    mockUsePathname.mockReturnValue("/about");
    mockUseRouter.mockReturnValue(routerWith(vi.fn()));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN the current locale is 'en'", () => {
    test("WHEN rendered THEN the trigger is named for the language it is on", () => {
      // Arrange + Act
      render(<LocaleSwitcher />);

      // Assert — the name spells out the full concept, never the short code.
      expect(screen.getByRole("button", { name: "label: english" })).toBeInTheDocument();
    });

    test("WHEN rendered THEN both the short code and the full name are rendered as text", () => {
      // Arrange + Act
      render(<LocaleSwitcher />);

      // Assert — which one is visible is a CSS breakpoint concern; jsdom has
      // no layout, so the contract asserted here is that both variants exist
      // for the breakpoint to choose between.
      const trigger = screen.getByRole("button", { name: "label: english" });
      expect(trigger).toHaveTextContent("EN");
      expect(trigger).toHaveTextContent("english");
    });

    test("WHEN the menu is opened THEN it offers one option per supported locale", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LocaleSwitcher />);

      // Act
      await openMenu(user);

      // Assert
      expect(screen.getAllByRole("menuitemradio")).toHaveLength(3);
    });

    test("WHEN the menu is opened THEN the active locale is the checked option", async () => {
      // Arrange
      const user = userEvent.setup();
      mockUseLocale.mockReturnValue("es");
      render(<LocaleSwitcher />);

      // Act
      await openMenu(user);

      // Assert
      expect(screen.getByRole("menuitemradio", { name: "spanish" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("menuitemradio", { name: "english" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });
  });

  describe("GIVEN the user picks a different locale", () => {
    test("WHEN they choose 'es' THEN router.replace is called with the new locale and the current pathname", async () => {
      // Arrange
      const user = userEvent.setup();
      const replace = vi.fn();
      mockUseRouter.mockReturnValue(routerWith(replace));
      mockUsePathname.mockReturnValue("/dashboard");
      render(<LocaleSwitcher />);

      // Act
      await openMenu(user);
      await user.click(screen.getByRole("menuitemradio", { name: "spanish" }));

      // Assert
      expect(replace).toHaveBeenCalledWith("/dashboard", { locale: "es" });
    });

    test("WHEN they choose the locale they are already on THEN router.replace is still called (no-op navigation)", async () => {
      // Arrange
      const user = userEvent.setup();
      const replace = vi.fn();
      mockUseRouter.mockReturnValue(routerWith(replace));
      mockUseLocale.mockReturnValue("es");
      render(<LocaleSwitcher />);

      // Act
      await openMenu(user);
      await user.click(screen.getByRole("menuitemradio", { name: "spanish" }));

      // Assert
      expect(replace).toHaveBeenCalledWith("/about", { locale: "es" });
    });
  });

  describe("GIVEN a keyboard user", () => {
    test("WHEN they open the menu and pick an option with the keyboard THEN the locale changes", async () => {
      // Arrange
      const user = userEvent.setup();
      const replace = vi.fn();
      mockUseRouter.mockReturnValue(routerWith(replace));
      render(<LocaleSwitcher />);
      screen.getByRole("button", { name: "label: english" }).focus();

      // Act — Enter opens the menu and lands on the first item; Radix moves
      // focus with the arrow keys from there.
      await user.keyboard("{Enter}");
      await user.keyboard("{ArrowDown}{Enter}");

      // Assert
      expect(replace).toHaveBeenCalledWith("/about", { locale: "es" });
    });

    test("WHEN they dismiss the menu THEN focus returns to the trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LocaleSwitcher />);

      // Act
      const trigger = await openMenu(user);
      await user.keyboard("{Escape}");

      // Assert
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });
});
