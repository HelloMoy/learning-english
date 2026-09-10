import "@testing-library/jest-dom/vitest";

import NiceModal from "@ebay/nice-modal-react";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AddToHomeScreenModal } from "./add-to-home-screen-modal";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  dialogTitle: "Añadir a pantalla de inicio",
  label: "Ten el curso a un toque",
  payoff: "Añádelo a tu pantalla de inicio y se abre como una app, sin buscar la pestaña.",
  iosMore: "···",
  iosShare: "Compartir",
  iosAddToHomeScreen: "Añadir a pantalla de inicio",
  iosAdd: "Añadir",
  iosOpenAsWebApp: "Abrir como app web",
  stepMore: "Toca «···» en la barra de abajo, a la derecha de la dirección.",
  stepShare: "Elige «Compartir», la primera opción del menú.",
  stepAddToHomeScreen: "Baja en la lista y elige «Añadir a pantalla de inicio».",
  stepAdd: "Toca «Añadir». Deja activado «Abrir como app web».",
  result: "Listo: el curso queda en tu pantalla de inicio, como cualquier otra app.",
  progress: "Paso {current} de {total}",
  dismiss: "Cerrar la guía",
};

const translate = (key: string, values?: Record<string, unknown>) =>
  Object.entries(values ?? {}).reduce<string>(
    (copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)),
    MESSAGES[key] ?? key,
  );

/** NiceModal only renders what it has been told to show. */
const ShownModal = () => {
  NiceModal.useModal(AddToHomeScreenModal);
  return null;
};

const renderShown = () =>
  render(
    <NiceModal.Provider>
      <ShownModal />
      <button onClick={() => void NiceModal.show(AddToHomeScreenModal)}>abrir</button>
    </NiceModal.Provider>,
  );

describe("AddToHomeScreenModal", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
  });

  describe("GIVEN a learner who asked how to install the app", () => {
    test("WHEN shown THEN the guide is inside a dialog named for the task", async () => {
      const { getByText } = renderShown();

      getByText("abrir").click();

      expect(await screen.findByRole("dialog", { name: MESSAGES.dialogTitle })).toBeInTheDocument();
    });

    test("WHEN shown THEN the guide's first step is in it", async () => {
      const { getByText } = renderShown();

      getByText("abrir").click();

      expect(await screen.findByText(MESSAGES.stepMore!)).toBeInTheDocument();
    });

    test("WHEN shown THEN exactly one control closes it", async () => {
      // The Dialog primitive draws its own close button and the guide draws
      // one too; two X's in a corner is a bug, not a choice.
      const { getByText } = renderShown();

      getByText("abrir").click();
      await screen.findByRole("dialog");

      expect(screen.getAllByRole("button", { name: MESSAGES.dismiss })).toHaveLength(1);
    });
  });
});
