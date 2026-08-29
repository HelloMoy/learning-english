import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  beforeEach(() => {
    // No global mock for next-themes yet — Button doesn't use it directly.
  });

  describe("GIVEN a default Button with children", () => {
    test("WHEN rendered THEN the children are visible to the user", () => {
      // Arrange
      const label = faker.lorem.word();

      // Act
      render(<Button>{label}</Button>);

      // Assert
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  describe("GIVEN a Button with an onClick handler", () => {
    test("WHEN the user clicks it THEN the handler is invoked once", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const label = faker.lorem.word();
      render(<Button onClick={handleClick}>{label}</Button>);

      // Act
      await user.click(screen.getByRole("button", { name: label }));

      // Assert
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe("GIVEN a disabled Button", () => {
    test("WHEN the user clicks it THEN the handler is NOT invoked", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const label = faker.lorem.word();
      render(
        <Button
          disabled
          onClick={handleClick}
        >
          {label}
        </Button>,
      );

      // Act
      await user.click(screen.getByRole("button", { name: label }));

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });

    test("WHEN rendered THEN the button has the disabled attribute", () => {
      // Arrange
      const label = faker.lorem.word();

      // Act
      render(<Button disabled>{label}</Button>);

      // Assert
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    });
  });

  describe("GIVEN a Button with each visual variant", () => {
    test("WHEN rendered with variant='destructive' THEN it carries the destructive data attribute", () => {
      // Arrange
      const label = faker.lorem.word();

      // Act
      render(<Button variant="destructive">{label}</Button>);

      // Assert
      const button = screen.getByRole("button", { name: label });
      expect(button).toHaveAttribute("data-variant", "destructive");
    });

    test("WHEN rendered with variant='outline' THEN it carries the outline data attribute", () => {
      // Arrange
      const label = faker.lorem.word();

      // Act
      render(<Button variant="outline">{label}</Button>);

      // Assert
      const button = screen.getByRole("button", { name: label });
      expect(button).toHaveAttribute("data-variant", "outline");
    });
  });

  describe("GIVEN a Button with asChild", () => {
    test("WHEN rendered THEN the child element is rendered instead of <button>", () => {
      // Arrange
      const label = faker.lorem.word();
      // A bare <a>, not next/link: this asserts that `asChild` renders the
      // child in place of <button>. Pulling in a router-aware Link would
      // couple the test to navigation it never exercises. The href is
      // external so `@next/next/no-html-link-for-pages` stays quiet — it
      // only objects to hand-rolled links at internal routes.
      render(
        <Button asChild>
          <a href="https://example.com/dashboard">{label}</a>
        </Button>,
      );

      // Act + Assert — the link should be present and accessible
      const link = screen.getByRole("link", { name: label });

      // Assert
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com/dashboard");
    });
  });
});
