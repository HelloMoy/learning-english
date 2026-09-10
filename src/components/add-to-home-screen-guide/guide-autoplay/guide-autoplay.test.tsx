import "@testing-library/jest-dom/vitest";

import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { INSTALL_STEPS } from "../install-steps/install-steps";
import { GuideAutoplay, STEP_INTERVAL_MS } from "./guide-autoplay";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
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
  progress: "Paso {current} de {total}",
  result: "Listo: el curso queda en tu pantalla de inicio, como cualquier otra app.",
  dismiss: "Cerrar la guía",
};

const translate = (key: string, values?: Record<string, unknown>) =>
  Object.entries(values ?? {}).reduce<string>(
    (copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)),
    MESSAGES[key] ?? key,
  );

/**
 * Timer-driven state changes have to be flushed inside `act`, or React never
 * applies them and every assertion below quietly reads the first step.
 */
const advanceSteps = async (count: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_INTERVAL_MS * count);
  });
};

/** jsdom has no matchMedia, and only this component needs one. */
const stubReducedMotion = (prefersReduce: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: prefersReduce,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

describe("GuideAutoplay", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("GIVEN a learner watching it play", () => {
    test("WHEN rendered THEN it opens on the first step", () => {
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      expect(screen.getByText(MESSAGES.stepMore!)).toBeInTheDocument();
    });

    test("WHEN the interval elapses THEN it advances to the next step", async () => {
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      await advanceSteps(1);

      expect(screen.getByText(MESSAGES.stepShare!)).toBeInTheDocument();
    });

    test("WHEN rendered THEN its copy is read from the guide's namespace", () => {
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.AddToHomeScreenGuide");
    });
  });

  describe("GIVEN a viewer who asked for less motion", () => {
    test("WHEN the interval elapses THEN it holds its first step", async () => {
      // A loop that keeps moving under someone who asked for stillness is the
      // thing the preference exists to stop; the step text is all they need.
      stubReducedMotion(true);
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      await advanceSteps(3);

      expect(screen.getByText(MESSAGES.stepMore!)).toBeInTheDocument();
    });
  });

  describe("GIVEN the guide is taken off screen", () => {
    test("WHEN unmounted THEN it stops its timer", () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
      const { unmount } = render(<GuideAutoplay onDismiss={vi.fn()} />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe("GIVEN iOS exposes no way for a page to install itself", () => {
    test("WHEN the dismiss control is activated THEN the caller is notified once", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<GuideAutoplay onDismiss={onDismiss} />);

      await user.click(screen.getByRole("button", { name: MESSAGES.dismiss }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    test("WHEN rendered THEN dismissing is the only control it offers", () => {
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      const controls = screen.getAllByRole("button");

      expect(controls).toHaveLength(1);
      expect(controls[0]).toHaveAttribute("aria-label", MESSAGES.dismiss);
    });
  });
});

describe("GuideAutoplay result frame", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("GIVEN the four taps buy the learner something", () => {
    test("WHEN the last tap has played THEN the result is shown", async () => {
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      await advanceSteps(INSTALL_STEPS.length);

      expect(screen.getByText(MESSAGES.result!)).toBeInTheDocument();
    });

    test("WHEN the result is shown THEN it is not numbered as a step", async () => {
      // Numbering it would tell the learner the flow costs five taps when it
      // costs four.
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      await advanceSteps(INSTALL_STEPS.length);

      expect(screen.queryByText(/^Paso \d+ de/)).not.toBeInTheDocument();
    });

    test("WHEN the result has played THEN it loops back to the first tap", async () => {
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      await advanceSteps(INSTALL_STEPS.length + 1);

      expect(screen.getByText(MESSAGES.stepMore!)).toBeInTheDocument();
    });

    test("WHEN the steps play THEN they are still numbered out of four", async () => {
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      await advanceSteps(1);

      expect(screen.getByText(`Paso 2 de ${INSTALL_STEPS.length}`)).toBeInTheDocument();
    });
  });
});

describe("GuideAutoplay fit", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
    stubReducedMotion(false);
  });

  describe("GIVEN a phone screen shorter than the depiction", () => {
    test("WHEN rendered THEN the depiction is in a box that clips and scales", () => {
      // It shrinks rather than the guide gaining a scrollbar: a set of
      // instructions that runs off the bottom of the phone is worse than a
      // smaller picture.
      const { container } = render(<GuideAutoplay onDismiss={vi.fn()} />);

      const box = container.querySelector(".overflow-hidden.flex-1");

      expect(box).toBeInTheDocument();
      // Centred by the flex box, and shrunk to the depiction so that scaling
      // about its centre cannot drag it sideways.
      expect(box).toHaveClass("justify-center");
      expect(box?.firstElementChild).toHaveClass("w-fit");
      expect(box?.firstElementChild).toHaveStyle({ transformOrigin: "top center" });
    });
  });
});
