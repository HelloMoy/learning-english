import { LEARNER_NAME_MAX_LENGTH } from "@/domain/entities/learner-profile/learner-profile";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { LearnerCardNameField } from "./learner-card-name-field";

const renderField = (value = "", onChange = vi.fn()) =>
  render(
    <LearnerCardNameField
      label="Your name"
      placeholder="Your name"
      value={value}
      onChange={onChange}
    />,
  );

describe("LearnerCardNameField", () => {
  test("WHEN it renders THEN it is a text field labelled by the label it was given", () => {
    renderField("Ana García");

    expect(screen.getByRole("textbox", { name: "Your name" })).toHaveValue("Ana García");
  });

  test("WHEN it renders THEN it carries the placeholder, autocomplete and the card's name limit", () => {
    renderField();

    const field = screen.getByRole("textbox", { name: "Your name" });
    expect(field).toHaveAttribute("placeholder", "Your name");
    expect(field).toHaveAttribute("autocomplete", "name");
    expect(field).toHaveAttribute("maxlength", String(LEARNER_NAME_MAX_LENGTH));
  });

  test("WHEN the learner types THEN every keystroke is reported", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField("", onChange);

    await user.type(screen.getByRole("textbox", { name: "Your name" }), "Ana");

    // The value is held by the caller, so each keystroke reports what the
    // field would hold on its own: the character just typed.
    expect(onChange.mock.calls.flat()).toEqual(["A", "n", "a"]);
  });

  test("WHEN it renders THEN it reads as a field, with its own line and focus ring", () => {
    // In-place editing fails when nothing on the card looks editable.
    renderField();

    const field = screen.getByRole("textbox", { name: "Your name" });
    expect(field.className).toContain("border-b");
    expect(field.className).toContain("focus-visible:");
  });

  test("WHEN it is asked to take focus THEN it does", () => {
    render(
      <LearnerCardNameField
        label="Your name"
        placeholder="Your name"
        value=""
        onChange={vi.fn()}
        autoFocus
      />,
    );

    expect(screen.getByRole("textbox", { name: "Your name" })).toHaveFocus();
  });
});
