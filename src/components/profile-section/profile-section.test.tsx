import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ProfileSection } from "./profile-section";

describe("ProfileSection", () => {
  describe("GIVEN a titled section", () => {
    test("WHEN it renders THEN the section is a region named by its own heading", () => {
      render(
        <ProfileSection title="Identity">
          <p>The name field</p>
        </ProfileSection>,
      );

      const region = screen.getByRole("region", { name: "Identity" });
      expect(
        within(region).getByRole("heading", { level: 2, name: "Identity" }),
      ).toBeInTheDocument();
      expect(within(region).getByText("The name field")).toBeInTheDocument();
    });

    test("WHEN two sections render THEN each is named by its own heading", () => {
      render(
        <>
          <ProfileSection title="Identity">
            <p>The name field</p>
          </ProfileSection>
          <ProfileSection title="Preferences">
            <p>The language row</p>
          </ProfileSection>
        </>,
      );

      expect(screen.getByRole("region", { name: "Identity" })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Preferences" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a supporting line", () => {
    test("WHEN a note is given THEN it is shown under the heading", () => {
      render(
        <ProfileSection
          title="Identity"
          note="Changes show on your card as you edit."
        >
          <p>The name field</p>
        </ProfileSection>,
      );

      expect(screen.getByText("Changes show on your card as you edit.")).toBeInTheDocument();
    });

    test("WHEN no note is given THEN the heading stands alone", () => {
      render(
        <ProfileSection title="Account">
          <p>The address</p>
        </ProfileSection>,
      );

      const region = screen.getByRole("region", { name: "Account" });
      expect(within(region).queryByTestId("profile-section-note")).not.toBeInTheDocument();
    });
  });
});
