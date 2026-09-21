import { renderInLocale } from "@/test-setup/render-in-locale";

import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { ProfileSaveBar, type ProfileSaveState } from "./profile-save-bar";

const renderBar = (
  state: ProfileSaveState,
  { canSave = true, locale }: { canSave?: boolean; locale?: "en" | "es" | "pt" } = {},
) => {
  const save = vi.fn();
  const discard = vi.fn();
  renderInLocale(
    <ProfileSaveBar
      state={state}
      canSave={canSave}
      onSave={save}
      onDiscard={discard}
    />,
    locale,
  );
  return { save, discard };
};

const saveButton = () => screen.queryByRole("button", { name: "Save changes" });
const discardButton = () => screen.queryByRole("button", { name: "Discard" });

describe("ProfileSaveBar", () => {
  describe("GIVEN a card with nothing edited", () => {
    test("WHEN the bar renders THEN there is nothing on the page", () => {
      renderBar("clean");

      expect(saveButton()).not.toBeInTheDocument();
      expect(discardButton()).not.toBeInTheDocument();
      expect(screen.queryByText("You have unsaved changes")).not.toBeInTheDocument();
    });
  });

  describe("GIVEN unsaved changes", () => {
    test("WHEN the bar renders THEN it says so and offers both controls", () => {
      renderBar("unsaved");

      expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
      expect(saveButton()).toBeEnabled();
      expect(discardButton()).toBeEnabled();
    });

    test("WHEN Save is pressed THEN the page is asked to save", async () => {
      const { save } = renderBar("unsaved");

      await userEvent.click(saveButton()!);

      expect(save).toHaveBeenCalledTimes(1);
    });

    test("WHEN Discard is pressed THEN the page is asked to discard", async () => {
      const { discard } = renderBar("unsaved");

      await userEvent.click(discardButton()!);

      expect(discard).toHaveBeenCalledTimes(1);
    });

    test("WHEN the name is blank THEN Save cannot be pressed", () => {
      renderBar("unsaved", { canSave: false });

      expect(saveButton()).toBeDisabled();
      expect(discardButton()).toBeEnabled();
    });
  });

  describe("GIVEN a save in flight", () => {
    test("WHEN the bar renders THEN Save cannot be pressed again", () => {
      renderBar("saving");

      expect(saveButton()).toBeDisabled();
    });
  });

  describe("GIVEN a card that was just saved", () => {
    test("WHEN the bar renders THEN the confirmation replaces the controls and is announced", () => {
      renderBar("saved");

      expect(screen.getByRole("status")).toHaveTextContent("Card updated");
      expect(saveButton()).not.toBeInTheDocument();
      expect(discardButton()).not.toBeInTheDocument();
    });
  });

  describe("GIVEN a learner reading in Spanish", () => {
    test("WHEN the bar renders THEN its copy comes from es.json", () => {
      renderBar("unsaved", { locale: "es" });

      expect(screen.getByText("Tienes cambios sin guardar")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Descartar" })).toBeInTheDocument();
    });
  });
});
