import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { withCinemaBackdrop } from "./cinema-backdrop";

const renderIn = (viewMode: "story" | "docs") =>
  render(
    withCinemaBackdrop(() => <p>The component under review</p>, {
      parameters: {},
      globals: {},
      viewMode,
    } as never) as never,
  );

const backdropOf = (container: HTMLElement) =>
  container.querySelector('[aria-hidden="true"].fixed.inset-0');

describe("withCinemaBackdrop", () => {
  it("paints the app's cinema backdrop behind a story in story view", () => {
    const { container } = renderIn("story");

    expect(screen.getByText("The component under review")).toBeInTheDocument();
    expect(backdropOf(container)).toBeInTheDocument();
  });

  it("leaves docs view alone, where each story is one block of a longer page", () => {
    const { container } = renderIn("docs");

    expect(screen.getByText("The component under review")).toBeInTheDocument();
    expect(backdropOf(container)).not.toBeInTheDocument();
  });
});
