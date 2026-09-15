import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { LearnerAvatar } from "./learner-avatar";

describe("LearnerAvatar", () => {
  describe("GIVEN the initials avatar", () => {
    test("WHEN rendered THEN it shows the initials and is announced as the learner's avatar", () => {
      renderInLocale(
        <LearnerAvatar
          name="Ana García"
          avatar={{ kind: "initials" }}
        />,
      );

      const avatar = screen.getByRole("img", { name: "Avatar: Ana García" });
      expect(avatar).toHaveTextContent("AG");
    });
  });

  describe("GIVEN an illustration avatar", () => {
    test("WHEN rendered THEN it shows that illustration and no initials", () => {
      renderInLocale(
        <LearnerAvatar
          name="Ana García"
          avatar={{ kind: "illustration", id: "night" }}
        />,
      );

      const avatar = screen.getByRole("img", { name: "Avatar: Ana García" });
      expect(avatar.querySelector('[data-illustration="night"]')).not.toBeNull();
      expect(avatar).not.toHaveTextContent("AG");
    });
  });

  describe("GIVEN the Spanish locale", () => {
    test("WHEN rendered THEN the accessible name comes from the Spanish catalogue", () => {
      renderInLocale(
        <LearnerAvatar
          name="Ana"
          avatar={{ kind: "initials" }}
        />,
        "es",
      );

      expect(screen.getByRole("img", { name: "Avatar de Ana" })).toBeInTheDocument();
    });
  });
});
