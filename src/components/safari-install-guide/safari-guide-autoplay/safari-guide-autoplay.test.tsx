import "@testing-library/jest-dom/vitest";

import { STEP_INTERVAL_MS } from "@/hooks/use-guide-playback/use-guide-playback";

import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SafariGuideAutoplay } from "./safari-guide-autoplay";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  progress: "Paso {current} de {total}",
  dismiss: "Cerrar la guía",
  previous: "Paso anterior",
  next: "Paso siguiente",
  goToStep: "Ir al paso {number}",
  goToResult: "Ir al resultado",
  ipadLabel: "Ten el curso a un toque",
  ipadPayoff: "Añádelo a tu pantalla de inicio y se abre como una app.",
  ipadStepShare: "Toca el botón de compartir en la barra de arriba.",
  ipadResult: "Listo: el curso queda en tu pantalla de inicio.",
  macLabel: "Ten el curso a un clic",
  macPayoff: "Añádelo al Dock y se abre en su propia ventana.",
  macStepShare: "Haz clic en el botón de compartir de la barra.",
  macStepAddToDock: "Elige «Añadir al Dock» en la lista que se abre.",
  macStepAdd: "Haz clic en «Añadir».",
  macResult: "Listo: el curso queda en tu Dock.",
  iosShare: "Compartir",
  iosViewMore: "Ver más",
  iosAddToHomeScreen: "Añadir a pantalla de inicio",
  iosAdd: "Añadir",
  iosOpenAsWebApp: "Abrir como app web",
  macAddToDock: "Añadir al Dock",
};

/**
 * One `act` per interval: the timer is re-armed by an effect, and advancing the
 * whole loop in a single call leaves React no commit in which to arm the next
 * one. The iPhone guide's suite steps the clock the same way.
 */
const playFrames = async (count: number) => {
  for (let frame = 0; frame < count; frame += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(STEP_INTERVAL_MS);
    });
  }
};

const translate = (key: string, values?: Record<string, unknown>) =>
  Object.entries(values ?? {}).reduce<string>(
    (copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)),
    MESSAGES[key] ?? key,
  );

describe("SafariGuideAutoplay", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("GIVEN an iPad learner watching it play", () => {
    test("WHEN rendered THEN it opens on the first tap", () => {
      render(
        <SafariGuideAutoplay
          platform="ipad"
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByText(MESSAGES.ipadStepShare!, { exact: false })).toBeInTheDocument();
    });

    test("WHEN rendered THEN the steps are numbered out of four", () => {
      // Four taps on an iPad, not the iPhone's five: the «···» step and the
      // Share step that follows it do not exist here.
      render(
        <SafariGuideAutoplay
          platform="ipad"
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByText("Paso 1 de 4")).toBeInTheDocument();
    });

    test("WHEN rendered THEN its copy is that platform's", () => {
      render(
        <SafariGuideAutoplay
          platform="ipad"
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByText(MESSAGES.ipadLabel!)).toBeInTheDocument();
      expect(screen.getByText(MESSAGES.ipadPayoff!)).toBeInTheDocument();
    });
  });

  describe("GIVEN a Mac learner, whose flow is shorter", () => {
    test("WHEN rendered THEN the steps are numbered out of three", () => {
      render(
        <SafariGuideAutoplay
          platform="mac"
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByText("Paso 1 de 3")).toBeInTheDocument();
    });

    test("WHEN rendered THEN its copy speaks of the Dock, not a home screen", () => {
      render(
        <SafariGuideAutoplay
          platform="mac"
          onDismiss={vi.fn()}
        />,
      );

      expect(screen.getByText(MESSAGES.macLabel!)).toBeInTheDocument();
      expect(screen.getByText(MESSAGES.macPayoff!)).toBeInTheDocument();
    });
  });

  describe("GIVEN the taps are the cost and the icon is what they buy", () => {
    test("WHEN the last tap has played THEN the result is shown, unnumbered", async () => {
      // Numbering the result would overstate how much work the flow takes.
      vi.useFakeTimers();
      const { container } = render(
        <SafariGuideAutoplay
          platform="mac"
          onDismiss={vi.fn()}
        />,
      );

      await playFrames(3);

      // Read the live region directly: the depiction's own markup is large
      // enough that a text query over the whole tree reports unhelpfully.
      const instruction = container.querySelector('[aria-live="polite"]');

      expect(instruction).toHaveTextContent(MESSAGES.macResult!);
      expect(instruction).not.toHaveTextContent(/Paso \d+ de/);
    });
  });

  describe("GIVEN Safari exposes no way for a page to install itself", () => {
    test("WHEN the dismiss control is activated THEN the caller is notified once", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <SafariGuideAutoplay
          platform="ipad"
          onDismiss={onDismiss}
        />,
      );

      await user.click(screen.getByRole("button", { name: MESSAGES.dismiss }));

      expect(onDismiss).toHaveBeenCalledOnce();
    });

    test("WHEN rendered THEN every control either closes it or moves it", () => {
      // Dismissal used to be the only control. It is not any more, and on a Mac
      // that matters most: a horizontal drag is not a gesture anyone performs
      // with a mouse, so without these the guide could not be moved at all.
      render(
        <SafariGuideAutoplay
          platform="mac"
          onDismiss={vi.fn()}
        />,
      );

      const names = screen
        .getAllByRole("button")
        .map((control) => control.getAttribute("aria-label"));
      const moves = names.filter(
        (name) => name === MESSAGES.previous || name === MESSAGES.next || name?.startsWith("Ir al"),
      );

      expect(names).toContain(MESSAGES.dismiss);
      expect(moves.length).toBe(names.length - 1);
    });
  });
});
