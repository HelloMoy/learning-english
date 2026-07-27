import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CinemaHero } from "./cinema-hero";

describe("CinemaHero", () => {
  test("renders the title, eyebrow, subtitle and CTAs", () => {
    render(
      <CinemaHero
        eyebrow="Now streaming"
        title="Learn English"
        subtitle="Practice every day."
        openLabel="Open course"
        openHref="/courses/x"
        myListLabel="+ My List"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Learn English" })).toBeInTheDocument();
    expect(screen.getByText("Now streaming")).toBeInTheDocument();
    expect(screen.getByText("Practice every day.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open course/ })).toHaveAttribute("href", "/courses/x");
    expect(screen.getByRole("button", { name: "+ My List" })).toBeInTheDocument();
  });

  test("omits the Open course link when no href is given (empty catalog)", () => {
    render(
      <CinemaHero
        eyebrow="Now streaming"
        title="Learn English"
        subtitle="Practice."
        openLabel="Open course"
        myListLabel="+ My List"
      />,
    );
    expect(screen.queryByRole("link", { name: /Open course/ })).not.toBeInTheDocument();
  });
});
