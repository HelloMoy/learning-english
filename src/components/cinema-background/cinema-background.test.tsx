import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { CinemaBackground } from "./cinema-background";

describe("CinemaBackground", () => {
  test("renders a decorative, aria-hidden backdrop", () => {
    const { container } = render(<CinemaBackground />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("pointer-events-none");
  });
});
