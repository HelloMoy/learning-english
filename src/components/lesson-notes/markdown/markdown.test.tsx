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

describe("Markdown typography", () => {
  /** The rendered element for a one-construct Markdown body. */
  function renderedElement(body: string, selector: string): Element {
    const { container } = render(<Markdown content={body} />);
    const element = container.querySelector(selector);
    if (element === null) throw new Error(`no <${selector}> rendered for: ${body}`);
    return element;
  }

  test.each([
    ["h1", "# Heading"],
    ["h2", "## Heading"],
    ["h3", "### Heading"],
    ["h4", "#### Heading"],
    ["p", "A paragraph."],
    ["ul", "- one\n- two"],
    ["li", "- one\n- two"],
    ["ol", "1. one\n2. two"],
    ["blockquote", "> Quoted."],
    ["strong", "**bold**"],
    ["em", "*emphasis*"],
    ["code", "`inline`"],
    ["hr", "---"],
  ])("WHEN a %s is rendered THEN it carries typography classes", (selector, body) => {
    expect(renderedElement(body, selector).getAttribute("class")).toBeTruthy();
  });

  test("WHEN headings descend THEN each level is styled distinctly", () => {
    const classes = ["h1", "h2", "h3", "h4"].map((level, index) =>
      renderedElement(`${"#".repeat(index + 1)} Heading`, level).getAttribute("class"),
    );

    expect(new Set(classes).size).toBe(classes.length);
  });

  test("WHEN a heading and a paragraph are rendered THEN they do not share styling", () => {
    const heading = renderedElement("### Heading", "h3").getAttribute("class");
    const paragraph = renderedElement("A paragraph.", "p").getAttribute("class");

    expect(heading).not.toEqual(paragraph);
  });
});
