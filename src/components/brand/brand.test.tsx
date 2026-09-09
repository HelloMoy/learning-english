import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Brand } from "./brand";

describe("Brand", () => {
  test("renders the wordmark as a link home with an accessible name", () => {
    render(<Brand />);
    const link = screen.getByRole("link", { name: /english.*course/i });
    expect(link).toHaveAttribute("href", "/");
  });

  test("renders the ENGLISH·COURSE wordmark", () => {
    render(<Brand />);
    expect(screen.getByRole("link", { name: /english.*course/i })).toHaveTextContent(
      "ENGLISH·COURSE",
    );
  });

  test("accepts a custom href", () => {
    render(<Brand href="/en" />);
    expect(screen.getByRole("link", { name: /english.*course/i })).toHaveAttribute("href", "/en");
  });
});
