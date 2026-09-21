import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SpinnerArc } from "./spinner-arc";

describe("SpinnerArc", () => {
  describe("GIVEN the arc renders", () => {
    test("WHEN it is on screen THEN it carries the class the stylesheet animates", () => {
      // Arrange + Act
      render(<SpinnerArc />);

      // Assert
      expect(screen.getByTestId("spinner-arc")).toHaveClass("spinner-arc");
    });

    test("WHEN a caller passes classes THEN they join the arc's own", () => {
      // Arrange + Act
      render(<SpinnerArc className="size-5" />);

      // Assert
      const arc = screen.getByTestId("spinner-arc");
      expect(arc).toHaveClass("size-5");
      expect(arc).toHaveClass("spinner-arc");
    });
  });

  describe("GIVEN assistive technology reads the page", () => {
    test("WHEN the arc is on screen THEN it is hidden from the accessibility tree", () => {
      // Arrange + Act
      render(<SpinnerArc />);

      // Assert
      expect(screen.getByTestId("spinner-arc")).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN the arc is on screen THEN it contributes no text and no role", () => {
      // Arrange + Act
      const { container } = render(<SpinnerArc />);

      // Assert
      expect(container).toHaveTextContent("");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });
});
