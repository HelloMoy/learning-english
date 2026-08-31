import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/**
 * A minimal single-choice menu — the shape the locale switcher composes.
 * Kept uncontrolled so the tests drive it the way a user does.
 */
const LanguageMenu = ({
  value = "en",
  onValueChange,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger>Language</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuRadioGroup
        value={value}
        onValueChange={onValueChange}
      >
        <DropdownMenuRadioItem value="en">
          <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
          English
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="es">
          <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
          Spanish
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

describe("DropdownMenu", () => {
  describe("GIVEN the module's public surface", () => {
    test("WHEN imported THEN every single-choice menu part is exported", () => {
      const parts = [
        DropdownMenu,
        DropdownMenuTrigger,
        DropdownMenuPortal,
        DropdownMenuContent,
        DropdownMenuRadioGroup,
        DropdownMenuRadioItem,
        DropdownMenuItemIndicator,
      ];

      expect(parts.every((part) => part !== undefined)).toBe(true);
    });
  });

  describe("GIVEN a closed menu", () => {
    test("WHEN rendered THEN the trigger reports it is not expanded", () => {
      // Arrange + Act
      render(<LanguageMenu />);

      // Assert
      expect(screen.getByRole("button", { name: "Language" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    test("WHEN rendered THEN no menu content is in the document", () => {
      // Arrange + Act
      render(<LanguageMenu />);

      // Assert
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN the user opens the menu", () => {
    test("WHEN the trigger is activated THEN the content is portalled outside the render container", async () => {
      // Arrange
      const user = userEvent.setup();
      const { container } = render(<LanguageMenu />);

      // Act
      await user.click(screen.getByRole("button", { name: "Language" }));

      // Assert — portalled content is mounted at the document root, so it is
      // reachable through `screen` but not inside RTL's container.
      const content = document.querySelector('[data-slot="dropdown-menu-content"]');
      expect(content).toBeInTheDocument();
      expect(container).not.toContainElement(content as HTMLElement);
    });

    test("WHEN open THEN the content exposes the menu role and its options are menuitemradio", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LanguageMenu />);

      // Act
      await user.click(screen.getByRole("button", { name: "Language" }));

      // Assert
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);
    });

    test("WHEN open THEN the trigger reports it is expanded", async () => {
      // Arrange — hold the element: while the menu is open Radix marks
      // everything outside the portalled content `aria-hidden`, including the
      // trigger, so a role query can no longer reach it.
      const user = userEvent.setup();
      render(<LanguageMenu />);
      const trigger = screen.getByRole("button", { name: "Language" });

      // Act
      await user.click(trigger);

      // Assert
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    test("WHEN open THEN exactly the active option is checked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LanguageMenu value="es" />);

      // Act
      await user.click(screen.getByRole("button", { name: "Language" }));

      // Assert
      expect(screen.getByRole("menuitemradio", { name: /spanish/i })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("menuitemradio", { name: /english/i })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });
  });

  describe("GIVEN an open menu", () => {
    test("WHEN an option is chosen THEN the group reports the new value", async () => {
      // Arrange
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <LanguageMenu
          value="en"
          onValueChange={onValueChange}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Language" }));

      // Act
      await user.click(screen.getByRole("menuitemradio", { name: /spanish/i }));

      // Assert
      expect(onValueChange).toHaveBeenCalledWith("es");
    });

    test("WHEN Escape is pressed THEN the menu closes and focus returns to the trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LanguageMenu />);
      const trigger = screen.getByRole("button", { name: "Language" });
      await user.click(trigger);

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    test("WHEN the arrow keys are used THEN focus moves between options", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LanguageMenu />);
      await user.click(screen.getByRole("button", { name: "Language" }));

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(screen.getByRole("menuitemradio", { name: /english/i })).toHaveFocus();
    });
  });
});
