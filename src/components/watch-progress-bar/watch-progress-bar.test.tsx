import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { WatchProgressBar } from "./watch-progress-bar";

describe("WatchProgressBar", () => {
  test("WHEN rendered THEN it is a progress bar carrying its value and bounds", () => {
    render(
      <WatchProgressBar
        value={7}
        max={17}
        label="7 / 17 videos"
        ariaLabel="7 of 17 videos completed"
      />,
    );

    const bar = screen.getByRole("progressbar", { name: "7 of 17 videos completed" });
    expect(bar).toHaveAttribute("aria-valuenow", "7");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "17");
  });

  test("WHEN rendered THEN the visible label states the same thing as the bar", () => {
    // Colour is never the only signal: a learner who cannot tell the fill
    // from the track still reads the number beside it.
    render(
      <WatchProgressBar
        value={40}
        max={100}
        label="40%"
        ariaLabel="40% watched"
      />,
    );

    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  test("WHEN the value is part way THEN the fill spans that share of the track", () => {
    render(
      <WatchProgressBar
        value={40}
        max={100}
        label="40%"
        ariaLabel="40% watched"
      />,
    );

    expect(screen.getByTestId("watch-progress-fill")).toHaveStyle({ width: "40%" });
  });

  test("WHEN the value runs past the maximum THEN the fill is clamped to full", () => {
    render(
      <WatchProgressBar
        value={120}
        max={100}
        label="100%"
        ariaLabel="100% watched"
      />,
    );

    expect(screen.getByTestId("watch-progress-fill")).toHaveStyle({ width: "100%" });
  });

  test("WHEN the value is negative THEN the fill is clamped to empty", () => {
    render(
      <WatchProgressBar
        value={-5}
        max={100}
        label="0%"
        ariaLabel="0% watched"
      />,
    );

    expect(screen.getByTestId("watch-progress-fill")).toHaveStyle({ width: "0%" });
  });

  test("WHEN the maximum is zero THEN the fill is empty rather than NaN", () => {
    render(
      <WatchProgressBar
        value={0}
        max={0}
        label="0 / 0"
        ariaLabel="nothing to watch"
      />,
    );

    expect(screen.getByTestId("watch-progress-fill")).toHaveStyle({ width: "0%" });
  });

  test("WHEN an arbitrary in-range value is given THEN it is reported verbatim", () => {
    const max = faker.number.int({ min: 1, max: 200 });
    const value = faker.number.int({ min: 0, max });

    render(
      <WatchProgressBar
        value={value}
        max={max}
        label="label"
        ariaLabel="aria"
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(value));
  });
});
