import "@testing-library/jest-dom/vitest";

import NiceModal from "@ebay/nice-modal-react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UnmarkLessonModal } from "./unmark-lesson-modal";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so a raw key or an English fallback fails here. */
const MESSAGES: Record<string, string> = {
  title: "¿Desmarcar esta lección?",
  consequence:
    "Volverá a contar como pendiente: tu progreso del curso y del módulo bajará y su marca de completada desaparecerá del índice y de las listas de lecciones.",
  rewatch: "Si vuelves a verla hasta el final, se marcará como completada otra vez.",
  positionKept: "Tu posición de reproducción guardada no se borra.",
  confirm: "Desmarcar lección",
  cancel: "Cancelar",
};

const translate = (key: string) => MESSAGES[key] ?? key;

/** NiceModal only renders what it has been told to show. */
const ShownModal = () => {
  NiceModal.useModal(UnmarkLessonModal);
  return null;
};

/** Resolves with whatever the learner decided, so the caller can be asserted on. */
const renderWithDecision = (onDecision: (confirmed: unknown) => void) =>
  render(
    <NiceModal.Provider>
      <ShownModal />
      <button onClick={() => void NiceModal.show(UnmarkLessonModal).then(onDecision)}>abrir</button>
    </NiceModal.Provider>,
  );

describe("UnmarkLessonModal", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
  });

  describe("GIVEN a learner about to undo their own completion", () => {
    test("WHEN shown THEN it is a dialog that names what is about to happen", async () => {
      const user = userEvent.setup();
      renderWithDecision(vi.fn());

      await user.click(screen.getByText("abrir"));

      expect(await screen.findByRole("dialog", { name: MESSAGES.title })).toBeInTheDocument();
    });

    test("WHEN shown THEN it spells out every consequence", async () => {
      // A confirmation that only says "are you sure?" tells the learner
      // nothing they did not already know.
      const user = userEvent.setup();
      renderWithDecision(vi.fn());

      await user.click(screen.getByText("abrir"));
      await screen.findByRole("dialog");

      expect(screen.getByText(MESSAGES.consequence!)).toBeInTheDocument();
      expect(screen.getByText(MESSAGES.rewatch!)).toBeInTheDocument();
      expect(screen.getByText(MESSAGES.positionKept!)).toBeInTheDocument();
    });

    test("WHEN the learner confirms THEN it resolves true", async () => {
      const user = userEvent.setup();
      const onDecision = vi.fn();
      renderWithDecision(onDecision);

      await user.click(screen.getByText("abrir"));
      await user.click(await screen.findByRole("button", { name: MESSAGES.confirm }));

      expect(onDecision).toHaveBeenCalledWith(true);
    });

    test("WHEN the learner cancels THEN it resolves false", async () => {
      const user = userEvent.setup();
      const onDecision = vi.fn();
      renderWithDecision(onDecision);

      await user.click(screen.getByText("abrir"));
      await user.click(await screen.findByRole("button", { name: MESSAGES.cancel }));

      expect(onDecision).toHaveBeenCalledWith(false);
    });

    test("WHEN the learner presses Escape THEN it resolves false too", async () => {
      // Dismissing is a decision, not a dropped promise: a caller awaiting
      // it would otherwise hang with the lesson in limbo.
      const user = userEvent.setup();
      const onDecision = vi.fn();
      renderWithDecision(onDecision);

      await user.click(screen.getByText("abrir"));
      await screen.findByRole("dialog");
      await user.keyboard("{Escape}");

      expect(onDecision).toHaveBeenCalledWith(false);
    });
  });
});
