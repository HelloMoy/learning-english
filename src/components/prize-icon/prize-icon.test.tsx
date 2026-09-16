import { PRIZE_IDS } from "@/lib/module-prizes/module-prizes";

import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PrizeIcon } from "./prize-icon";

const fillsOf = (container: HTMLElement) =>
  new Set(
    Array.from(container.querySelectorAll("svg *"))
      .flatMap((shape) => [shape.getAttribute("fill"), shape.getAttribute("stroke")])
      .filter((paint): paint is string => Boolean(paint) && paint !== "none"),
  );

describe("PrizeIcon", () => {
  test.each(PRIZE_IDS)("WHEN the %s is drawn THEN one decorative illustration renders", (prize) => {
    const { container } = render(<PrizeIcon prize={prize} />);

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveAttribute("aria-hidden", "true");
    expect(svgs[0]).toHaveAttribute("data-prize", prize);
    expect(svgs[0]!.children.length).toBeGreaterThan(0);
  });

  test("WHEN a prize is drawn in colour THEN it uses more than one paint", () => {
    const { container } = render(<PrizeIcon prize="harmonica" />);

    expect(fillsOf(container).size).toBeGreaterThan(1);
  });

  test("WHEN a prize is locked THEN every shape is painted the single silhouette colour", () => {
    const { container } = render(
      <PrizeIcon
        prize="harmonica"
        locked
      />,
    );

    expect([...fillsOf(container)]).toEqual(["var(--prize-silhouette)"]);
    expect(container.querySelector("svg")).toHaveAttribute("data-locked", "true");
  });

  test("WHEN a size is given THEN the illustration is drawn at that size", () => {
    const { container } = render(
      <PrizeIcon
        prize="robot"
        size={48}
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
  });
});
