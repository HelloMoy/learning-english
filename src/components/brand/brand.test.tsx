import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Brand } from "./brand";

describe("Brand", () => {
  test("renders the wordmark as a link home with an accessible name", () => {
    render(<Brand />);
    const link = screen.getByRole("link", { name: /learn.*english/i });
    expect(link).toHaveAttribute("href", "/");
  });

  test("accepts a custom href", () => {
    render(<Brand href="/en" />);
    expect(screen.getByRole("link", { name: /learn.*english/i })).toHaveAttribute("href", "/en");
  });
});
