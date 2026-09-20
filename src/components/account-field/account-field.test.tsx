import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { AccountField } from "./account-field";

describe("AccountField", () => {
  test("WHEN it renders THEN its input is named by a visible label", () => {
    render(
      <AccountField
        name="email"
        type="email"
        label="Email"
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  test("WHEN the learner types THEN the new value is handed up", async () => {
    const onChange = vi.fn();
    render(
      <AccountField
        name="name"
        label="Your name"
        value=""
        onChange={onChange}
      />,
    );

    await userEvent.type(screen.getByLabelText("Your name"), "A");

    expect(onChange).toHaveBeenCalledWith("A");
  });

  test("WHEN there is an error THEN the input is invalid, describes itself with it, and it is announced", () => {
    render(
      <AccountField
        name="password"
        type="password"
        label="Password"
        hint="Between 8 and 128 characters."
        error="Use between 8 and 128 characters."
        value=""
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Between 8 and 128 characters. Use between 8 and 128 characters.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Use between 8 and 128 characters.");
  });

  test("WHEN there is no error THEN the input is not marked invalid", () => {
    render(
      <AccountField
        name="email"
        label="Email"
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
