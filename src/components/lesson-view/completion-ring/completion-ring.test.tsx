import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CompletionRing } from "./completion-ring";

const circumferenceOf = (arc: HTMLElement) => 2 * Math.PI * Number(arc.getAttribute("r"));

const dashLengthOf = (arc: HTMLElement) =>
  Number((arc.getAttribute("stroke-dasharray") ?? "").split(" ")[0]);

describe("CompletionRing", () => {
  test("WHEN part of the work is done THEN the fill covers that share of the circle", () => {
    // Arrange
    const fraction = faker.number.float({ min: 0.05, max: 0.95, fractionDigits: 2 });

    // Act
    render(
      <CompletionRing
        size={24}
        fraction={fraction}
      />,
    );

    // Assert
    const fill = screen.getByTestId("completion-ring-fill");
    expect(dashLengthOf(fill)).toBeCloseTo(circumferenceOf(fill) * fraction, 1);
  });

  test("WHEN nothing is done THEN only the track draws, with no fill at all", () => {
    // Act
    render(
      <CompletionRing
        size={24}
        fraction={0}
      />,
    );

    // Assert — a zero-length dash still paints a cap, which would read as
    // "started"; the fill must be absent, not merely empty.
    expect(screen.getByTestId("completion-ring-track")).toBeInTheDocument();
    expect(screen.queryByTestId("completion-ring-fill")).toBeNull();
  });

  test("WHEN the fraction exceeds one THEN the fill is clamped to the whole circle", () => {
    // Act
    render(
      <CompletionRing
        size={24}
        fraction={1.4}
      />,
    );

    // Assert
    const fill = screen.getByTestId("completion-ring-fill");
    expect(dashLengthOf(fill)).toBeCloseTo(circumferenceOf(fill), 1);
  });

  test("WHEN given content THEN it is centred inside the ring and the drawing is decorative", () => {
    // Arrange
    const label = `${faker.number.int({ min: 1, max: 99 })}%`;

    // Act
    const { container } = render(
      <CompletionRing
        size={44}
        fraction={0.3}
      >
        {label}
      </CompletionRing>,
    );

    // Assert
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
