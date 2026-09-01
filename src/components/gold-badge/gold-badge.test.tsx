import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { GoldBadge } from "./gold-badge";

describe("GoldBadge", () => {
  test("renders its content", () => {
    render(<GoldBadge>10 modules · 107 lessons</GoldBadge>);
    expect(screen.getByText("10 modules · 107 lessons")).toBeInTheDocument();
  });

  test("supports a neutral variant", () => {
    render(<GoldBadge variant="neutral">Module</GoldBadge>);
    expect(screen.getByText("Module")).toBeInTheDocument();
  });

  test("forwards a test id so callers can target one badge among several", () => {
    // A card carries several badges whose text is a translation key under
    // test; without a handle, the only way to pick one out is its copy.
    render(<GoldBadge data-testid="course-level-state">In progress</GoldBadge>);
    expect(screen.getByTestId("course-level-state")).toHaveTextContent("In progress");
  });
});
