import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ProgressRing } from "./progress-ring";

const arcOf = (container: HTMLElement) =>
  container.querySelector("[data-slot='progress-ring-arc']");

describe("ProgressRing", () => {
  test("WHEN rendered THEN its label is real text and the drawing is hidden from assistive technology", () => {
    const { container } = render(
      <ProgressRing
        share={0.25}
        label="25%"
      />,
    );

    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  test("WHEN half is done THEN the arc covers half the circle", () => {
    const { container } = render(
      <ProgressRing
        share={0.5}
        label="50%"
      />,
    );

    const [drawn, circumference] = arcOf(container)!
      .getAttribute("stroke-dasharray")!
      .split(" ")
      .map(Number);
    expect(drawn).toBeCloseTo(circumference! / 2);
  });

  test("WHEN nothing is done THEN no arc is drawn, rather than a dot", () => {
    const { container } = render(
      <ProgressRing
        share={0}
        label="0%"
      />,
    );

    expect(arcOf(container)).toBeNull();
  });
});
