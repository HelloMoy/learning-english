import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Eyebrow } from "./eyebrow";

describe("Eyebrow", () => {
  test("renders its children", () => {
    render(<Eyebrow>Now streaming</Eyebrow>);
    expect(screen.getByText("Now streaming")).toBeInTheDocument();
  });

  test("can render as a heading element", () => {
    render(<Eyebrow as="h2">Season 1</Eyebrow>);
    expect(screen.getByRole("heading", { level: 2, name: "Season 1" })).toBeInTheDocument();
  });
});
