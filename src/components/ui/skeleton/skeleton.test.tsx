import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Skeleton } from "./skeleton";

/** The primitive renders no text, so every query goes through its slot attribute. */
const skeletonElement = (): HTMLElement | null => document.querySelector('[data-slot="skeleton"]');

describe("Skeleton", () => {
  describe("GIVEN a Skeleton with no props", () => {
    test("WHEN rendered THEN it draws a pulsing block in the theme's muted fill", () => {
      // Act
      render(<Skeleton />);

      // Assert
      const skeleton = skeletonElement();
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("animate-pulse");
      expect(skeleton).toHaveClass("bg-muted");
    });
  });

  describe("GIVEN a Skeleton shaped by its caller", () => {
    test("WHEN a className is passed THEN it is merged onto the primitive's own classes", () => {
      // Arrange
      const callerClass = `h-${faker.number.int({ min: 2, max: 40 })}`;

      // Act
      render(<Skeleton className={callerClass} />);

      // Assert
      const skeleton = skeletonElement();
      expect(skeleton).toHaveClass(callerClass);
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  describe("GIVEN a Skeleton standing in for content", () => {
    test("WHEN rendered THEN assistive technology finds nothing to announce", () => {
      // Act
      render(<Skeleton />);

      // Assert
      // Every ARIA role a screen reader would stop on — the primitive claims none,
      // so a shell built from a dozen of these announces once, not a dozen times.
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(skeletonElement()).toHaveTextContent("");
      expect(skeletonElement()).not.toHaveAttribute("aria-label");
    });
  });
});
