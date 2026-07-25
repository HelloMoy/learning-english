import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Markdown } from "./markdown";

describe("Markdown", () => {
  test("renders headings, paragraphs and lists from a Markdown body", () => {
    const body = "# Heading\n\nThis is a paragraph with a [link](https://example.com).";
    const { container } = render(<Markdown content={body} />);
    expect(screen.getByRole("heading", { level: 1, name: "Heading" })).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) => {
        if (!element) return false;
        return element.textContent === "This is a paragraph with a link.";
      }),
    ).toBeInTheDocument();
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  test("does not render raw HTML embedded in the Markdown body", () => {
    const body = "Hello <script>alert('xss')</script> <img src=x onerror=alert(1)>";
    const { container } = render(<Markdown content={body} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
