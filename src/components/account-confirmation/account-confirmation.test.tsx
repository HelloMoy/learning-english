import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AccountConfirmation } from "./account-confirmation";

describe("AccountConfirmation", () => {
  test("WHEN it replaces a form THEN its title is a heading and its message is announced", () => {
    render(
      <AccountConfirmation
        title="Check your inbox"
        message="We sent a link to ana@example.com."
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("We sent a link to ana@example.com.");
  });

  test("WHEN an action is given THEN it follows the message", () => {
    render(
      <AccountConfirmation
        title="This link no longer works"
        message="Ask for a new one."
        action={<a href="#request-new-link">Send me a new link</a>}
      />,
    );

    expect(screen.getByRole("link", { name: "Send me a new link" })).toBeInTheDocument();
  });

  test("WHEN the message names the learner's address THEN it is kept out of usage data", () => {
    render(
      <AccountConfirmation
        title="Check your inbox"
        message="We sent a link to ana@example.com."
        personal
      />,
    );

    // PostHog blanks an element with this class in recordings and captures no
    // click from it. See `NOT_CAPTURED_CLASS`.
    expect(screen.getByRole("status")).toHaveClass("ph-no-capture");
  });

  test("WHEN the message names nobody THEN it is captured like any other text", () => {
    render(
      <AccountConfirmation
        title="This link no longer works"
        message="Ask for a new one."
      />,
    );

    expect(screen.getByRole("status")).not.toHaveClass("ph-no-capture");
  });
});
