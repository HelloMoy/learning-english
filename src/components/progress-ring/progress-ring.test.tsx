import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ProgressRing } from "./progress-ring";

const circumferenceOf = (arc: HTMLElement) => 2 * Math.PI * Number(arc.getAttribute("r"));

const dashLengths = (arc: HTMLElement) =>
  (arc.getAttribute("stroke-dasharray") ?? "").split(" ").map(Number);

describe("ProgressRing", () => {
  describe("GIVEN a completed fraction", () => {
    test("WHEN the ring renders THEN its fill covers that share of the circle", () => {
      // Arrange
      const fraction = faker.number.float({ min: 0.05, max: 0.95, fractionDigits: 2 });

      // Act
      render(
        <ProgressRing
          size={220}
          fraction={fraction}
        />,
      );

      // Assert
      const fill = screen.getByTestId("progress-ring-fill");
      const [dash] = dashLengths(fill);
      expect(dash).toBeCloseTo(circumferenceOf(fill) * fraction, 1);
    });

    test("WHEN the fraction exceeds one THEN the fill is clamped to the whole circle", () => {
      // Arrange + Act
      render(
        <ProgressRing
          size={220}
          fraction={1.4}
        />,
      );

      // Assert
      const fill = screen.getByTestId("progress-ring-fill");
      expect(dashLengths(fill)[0]).toBeCloseTo(circumferenceOf(fill), 1);
    });
  });

  describe("GIVEN a number of segments", () => {
    test("WHEN the ring renders THEN its track is split into that many dashes AND exactly one is lit", () => {
      // Arrange
      const segments = faker.number.int({ min: 2, max: 40 });

      // Act
      render(
        <ProgressRing
          size={220}
          segments={segments}
        />,
      );

      // Assert
      const track = screen.getByTestId("progress-ring-track");
      const [dash, gap] = dashLengths(track);
      expect((dash! + gap!) * segments).toBeCloseTo(circumferenceOf(track), 1);
      const lit = screen.getByTestId("progress-ring-fill");
      expect(dashLengths(lit)[0]).toBeCloseTo(dash!, 5);
    });
  });

  describe("GIVEN a label inside the ring", () => {
    test("WHEN the ring renders THEN the label is shown AND the drawing is hidden from assistive technology", () => {
      // Arrange
      const label = faker.lorem.words(2);

      // Act
      render(
        <ProgressRing
          size={170}
          fraction={0.5}
        >
          {label}
        </ProgressRing>,
      );

      // Assert
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByTestId("progress-ring-fill").closest("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });
});
