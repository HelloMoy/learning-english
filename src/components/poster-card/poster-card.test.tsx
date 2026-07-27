import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PosterCard } from "./poster-card";

describe("PosterCard", () => {
  test("renders as a link whose accessible name includes the title", () => {
    render(
      <PosterCard
        title="Contractions Reductions"
        number="03"
        href="/courses/c/modules/m"
      />,
    );
    const link = screen.getByRole("link", { name: /Contractions Reductions/ });
    expect(link).toHaveAttribute("href", "/courses/c/modules/m");
    // The oversized episode number is part of the poster.
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  test("renders a poster image with alt text when a URL is provided", () => {
    render(
      <PosterCard
        title="Intro"
        posterUrl="/local-filesystem-lesson/snapshot.jpeg"
        posterAlt="Intro poster"
      />,
    );
    expect(screen.getByRole("img", { name: "Intro poster" })).toBeInTheDocument();
  });

  test("renders the glow-only fallback (no image) when no URL is provided", () => {
    render(<PosterCard title="Intro" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
  });

  test("the decorative play affordance is not an interactive control", () => {
    render(
      <PosterCard
        title="Intro"
        href="/x"
        showPlay
      />,
    );
    // The card link is the only control; the play glyph is decorative.
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
