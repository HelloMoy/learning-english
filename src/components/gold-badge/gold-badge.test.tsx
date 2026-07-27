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
});
