import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CinemaHero } from "./cinema-hero";

describe("CinemaHero", () => {
  test("renders the eyebrow, title and subtitle", () => {
    render(
      <CinemaHero
        eyebrow="Now streaming"
        title="Start where your ear is"
        subtitle="Practice every day."
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Start where your ear is" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Now streaming")).toBeInTheDocument();
    expect(screen.getByText("Practice every day.")).toBeInTheDocument();
  });

  test("carries no call to action of its own", () => {
    // The home's one primary action is `Resume` in the continue-watching
    // panel, and each course card carries its own. A third button competing
    // from the hero would leave a learner with no obvious next step.
    const { container } = render(
      <CinemaHero
        eyebrow="Now streaming"
        title="Start where your ear is"
        subtitle="Practice every day."
      />,
    );
    expect(container.querySelectorAll("a, button")).toHaveLength(0);
  });
});
