import type { LearnerAvatar } from "@/domain/entities/learner-profile/learner-profile";
import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";

import { AvatarPicker } from "./avatar-picker";

function ControlledPicker({ initial }: { initial: LearnerAvatar }) {
  const [avatar, setAvatar] = useState(initial);
  return (
    <AvatarPicker
      name="Ana García"
      value={avatar}
      onChange={setAvatar}
    />
  );
}

describe("AvatarPicker", () => {
  test("WHEN rendered THEN it offers the initials and the eight illustrations as one choice", () => {
    renderInLocale(<ControlledPicker initial={{ kind: "initials" }} />);

    const group = screen.getByRole("radiogroup", { name: "Avatar" });
    const options = screen.getAllByRole("radio");
    expect(group).toBeInTheDocument();
    // The initials preview is decoration: the option is announced by its label.
    const expectedNames = [
      "Initials",
      "Sunny",
      "Wave",
      "Sprout",
      "Plum",
      "Ember",
      "Echo",
      "Night",
      "Schwa",
    ];
    expect(options).toHaveLength(expectedNames.length);
    options.forEach((option, index) => {
      expect(option).toHaveAccessibleName(expectedNames[index]);
    });
    expect(options[0]).toHaveAttribute("aria-checked", "true");
  });

  test("WHEN an illustration is pressed THEN it alone is checked", async () => {
    const user = userEvent.setup();
    renderInLocale(<ControlledPicker initial={{ kind: "initials" }} />);

    await user.click(screen.getByRole("radio", { name: "Plum" }));

    const checked = screen
      .getAllByRole("radio")
      .filter((option) => option.getAttribute("aria-checked") === "true");
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName("Plum");
  });

  test("WHEN an option is pressed THEN the chosen avatar is reported", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderInLocale(
      <AvatarPicker
        name="Ana"
        value={{ kind: "initials" }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Echo" }));

    expect(onChange).toHaveBeenCalledWith({ kind: "illustration", id: "echo" });
  });

  test("WHEN the right arrow key is pressed on the checked option THEN the next one is checked and focused", async () => {
    const user = userEvent.setup();
    renderInLocale(<ControlledPicker initial={{ kind: "illustration", id: "sun" }} />);

    screen.getByRole("radio", { name: "Sunny" }).focus();
    await user.keyboard("{ArrowRight}");

    const wave = screen.getByRole("radio", { name: "Wave" });
    expect(wave).toHaveAttribute("aria-checked", "true");
    expect(wave).toHaveFocus();
  });

  test("WHEN the left arrow key is pressed on the first option THEN the choice wraps to the last", async () => {
    const user = userEvent.setup();
    renderInLocale(<ControlledPicker initial={{ kind: "initials" }} />);

    screen.getByRole("radio", { name: "Initials" }).focus();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("radio", { name: "Schwa" })).toHaveAttribute("aria-checked", "true");
  });

  test("WHEN tabbing into the group THEN only the checked option is a tab stop", () => {
    renderInLocale(<ControlledPicker initial={{ kind: "illustration", id: "leaf" }} />);

    const tabStops = screen
      .getAllByRole("radio")
      .filter((option) => option.getAttribute("tabindex") === "0");
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toHaveAccessibleName("Sprout");
  });
});
