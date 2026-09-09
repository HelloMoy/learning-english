import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SHARE_CARD_SIZE, ShareCard } from "./share-card";

/**
 * Guards the `site-metadata` capability's "every route renders its own sharing
 * image" requirement.
 *
 * The card is normally rendered by Satori, not a browser — but it is a plain
 * function returning an element tree, so its *composition* is testable here.
 * What is not testable here is how Satori lays it out, which is why the e2e
 * suite fetches the real PNGs and the artwork is reviewed by eye.
 *
 * The headline sizing is the part that most needs a test: it is the only
 * behaviour in the file, and it exists because catalog descriptions vary enough
 * that one size overruns the card.
 */
const headlineStyle = (element: HTMLElement) =>
  element.style.fontSize === "" ? undefined : element.style.fontSize;

describe("ShareCard", () => {
  test("renders at exactly the Open Graph card size", () => {
    expect(SHARE_CARD_SIZE).toEqual({ width: 1200, height: 630 });
  });

  test("always carries the brand wordmark", () => {
    render(<ShareCard headline="American pronunciation" />);

    expect(screen.getByText("ENGLISH")).toBeInTheDocument();
    expect(screen.getByText("COURSE")).toBeInTheDocument();
  });

  test("renders the headline it is given", () => {
    render(<ShareCard headline="American pronunciation from the ground up" />);

    expect(screen.getByText("American pronunciation from the ground up")).toBeInTheDocument();
  });

  test.each([
    ["Welcome", "88px"],
    ["American pronunciation from the ground up", "72px"],
    ["A description long enough that a single type size would overrun the card entirely", "58px"],
  ])("steps the headline down as it grows: %s", (headline, expected) => {
    render(<ShareCard headline={headline} />);

    expect(headlineStyle(screen.getByText(headline))).toBe(expected);
  });

  test("omits the kicker, supporting line and badge when a route has none", () => {
    const { container } = render(<ShareCard headline="Welcome" />);

    // Wordmark (3 spans) plus the headline — nothing else.
    expect(container.textContent).toBe("ENGLISH·COURSEWelcome");
  });

  test("renders the kicker, supporting line, badge and facts a route supplies", () => {
    render(
      <ShareCard
        headline="Introduction"
        kicker="Basic Course · Module 1"
        supporting="Basic Course"
        badge="Lesson 1"
        facts={["03:15"]}
      />,
    );

    expect(screen.getByText("Basic Course · Module 1")).toBeInTheDocument();
    expect(screen.getByText("Basic Course")).toBeInTheDocument();
    expect(screen.getByText("Lesson 1")).toBeInTheDocument();
    expect(screen.getByText("03:15")).toBeInTheDocument();
  });

  test("separates facts from one another, and from a badge", () => {
    const { container } = render(
      <ShareCard
        headline="Basic Course"
        badge="Level 1"
        facts={["5 modules", "48 lessons"]}
      />,
    );

    // One separator before each fact, because a badge precedes the first.
    expect(container.textContent).toContain("Level 1·5 modules·48 lessons");
  });

  test("leads with the first fact when there is no badge", () => {
    const { container } = render(
      <ShareCard
        headline="Basic Course"
        facts={["5 modules", "48 lessons"]}
      />,
    );

    expect(container.textContent).toContain("5 modules·48 lessons");
    expect(container.textContent).not.toContain("·5 modules");
  });
});
