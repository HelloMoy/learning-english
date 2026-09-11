import "@testing-library/jest-dom/vitest";

import { SWIPE_THRESHOLD_PX } from "@/hooks/use-horizontal-swipe/use-horizontal-swipe";

import { act, fireEvent, render, screen } from "@testing-library/react";
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
const advanceClock = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

/**
 * One interval at a time: each frame schedules the next frame's wait from an
 * effect, and only an `act` boundary flushes that effect, so a single long
 * advance would run the first timer and then find nothing left to run.
 */
const advanceSteps = async (count: number) => {
  for (let step = 0; step < count; step += 1) await advanceClock(STEP_INTERVAL_MS);
};

/**
 * Explicit coordinates, because `userEvent.pointer` derives them from a layout
 * jsdom never computes — every element sits at the origin there, so every drag
 * it builds measures zero.
 */
const HORIZONTAL_TRAVEL = SWIPE_THRESHOLD_PX + 20;

const dragAcrossGuide = ({
  towards,
  alsoDownBy = 0,
}: {
  towards: "left" | "right";
  alsoDownBy?: number;
}) => {
  const start = { clientX: 300, clientY: 100 };
  const guide = screen.getByRole("region", { name: MESSAGES.label });

  fireEvent.pointerDown(guide, start);
  fireEvent.pointerUp(guide, {
    clientX:
      towards === "left" ? start.clientX - HORIZONTAL_TRAVEL : start.clientX + HORIZONTAL_TRAVEL,
    clientY: start.clientY + alsoDownBy,
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
    test("WHEN unmounted THEN it leaves no timer running", () => {
      // Asserted as a pending timer rather than as a call to `clearInterval`,
      // so the guide is free to be timed however it likes and the rule stays
      // the one the requirement states.
      vi.useFakeTimers();
      const { unmount } = render(<GuideAutoplay onDismiss={vi.fn()} />);
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
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

describe("GuideAutoplay by hand", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("GIVEN a learner who reads faster, or slower, than the loop plays", () => {
    test("WHEN they drag towards the left THEN the next step is shown", () => {
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      dragAcrossGuide({ towards: "left" });

      expect(screen.getByText(MESSAGES.stepShare!)).toBeInTheDocument();
    });

    test("WHEN they drag back towards the right THEN the previous step returns", () => {
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      dragAcrossGuide({ towards: "left" });
      dragAcrossGuide({ towards: "right" });

      expect(screen.getByText(MESSAGES.stepMore!)).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner who overshot the frame they wanted", () => {
    test("WHEN they drag back from the first step THEN the result is shown", () => {
      // Reversing has to reach the frame they just missed; a carousel that
      // dead-ends here costs them the whole loop to come back.
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      dragAcrossGuide({ towards: "right" });

      expect(screen.getByText(MESSAGES.result!)).toBeInTheDocument();
    });

    test("WHEN they drag forward from the result THEN the first step is shown", () => {
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      dragAcrossGuide({ towards: "right" });
      dragAcrossGuide({ towards: "left" });

      expect(screen.getByText(MESSAGES.stepMore!)).toBeInTheDocument();
    });
  });

  describe("GIVEN a gesture is a nudge and not a takeover", () => {
    test("WHEN they move it by hand THEN the frame they chose gets a full interval", async () => {
      // The learner asked for this frame; taking it away a moment later
      // punishes them for when their gesture happened to land.
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);
      await advanceClock(STEP_INTERVAL_MS - 1);

      dragAcrossGuide({ towards: "left" });
      await advanceClock(1);

      expect(screen.getByText(MESSAGES.stepShare!)).toBeInTheDocument();
    });

    test("WHEN that interval then elapses THEN it plays on by itself", async () => {
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);
      await advanceClock(STEP_INTERVAL_MS - 1);

      dragAcrossGuide({ towards: "left" });
      await advanceClock(STEP_INTERVAL_MS + 1);

      expect(screen.getByText(MESSAGES.stepAddToHomeScreen!)).toBeInTheDocument();
    });
  });

  describe("GIVEN a viewer who asked for less motion has no timer to wait for", () => {
    test("WHEN they drag across the guide THEN it still moves one frame", () => {
      // Without the gesture this learner is left on the first step for good:
      // the preference silences the timer, and the timer is the only other way
      // the guide moves.
      stubReducedMotion(true);
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      dragAcrossGuide({ towards: "left" });

      expect(screen.getByText(MESSAGES.stepShare!)).toBeInTheDocument();
    });

    test("WHEN the guide has been moved by hand THEN it still does not play on", async () => {
      stubReducedMotion(true);
      vi.useFakeTimers();
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      dragAcrossGuide({ towards: "left" });
      await advanceSteps(3);

      expect(screen.getByText(MESSAGES.stepShare!)).toBeInTheDocument();
    });
  });

  describe("GIVEN a drag may be aimed at scrolling rather than at the guide", () => {
    test("WHEN a drag travels further down than sideways THEN the step is left alone", () => {
      render(<GuideAutoplay onDismiss={vi.fn()} />);

      dragAcrossGuide({ towards: "left", alsoDownBy: HORIZONTAL_TRAVEL + 1 });

      expect(screen.getByText(MESSAGES.stepMore!)).toBeInTheDocument();
    });
  });
});
