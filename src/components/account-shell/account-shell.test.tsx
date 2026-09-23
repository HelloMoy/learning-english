import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AccountShell } from "./account-shell";

describe("AccountShell", () => {
  test("WHEN it renders THEN the title is the page's one level-1 heading, with its subtitle", () => {
    render(
      <AccountShell
        title="Welcome back"
        subtitle="Sign in to pick up where you left off."
      >
        <form aria-label="sign in" />
      </AccountShell>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to pick up where you left off.")).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "sign in" })).toBeInTheDocument();
  });

  test("WHEN it renders THEN the card is where the wait's beam anchors and is clipped", () => {
    render(
      <AccountShell title="Welcome back">
        <p>body</p>
      </AccountShell>,
    );

    // The beam is absolutely positioned against this card and must not escape
    // its rounded corners — see `AccountWait`
    const card = screen.getByText("body").closest("section");
    expect(card).toHaveClass("relative");
    expect(card).toHaveClass("overflow-hidden");
  });

  test("WHEN a footer is given THEN it follows the card's content", () => {
    render(
      <AccountShell
        title="Welcome back"
        footer={<a href="#sign-up">Create an account</a>}
      >
        <p>body</p>
      </AccountShell>,
    );

    const body = screen.getByText("body");
    const footerLink = screen.getByRole("link", { name: "Create an account" });
    expect(
      body.compareDocumentPosition(footerLink) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
