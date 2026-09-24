import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { GuidePlaybackRail } from "./guide-playback-rail";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/** Spanish, so English fallbacks or raw keys fail here. */
const MESSAGES: Record<string, string> = {
  previous: "Paso anterior",
  next: "Paso siguiente",
  goToStep: "Ir al paso {number}",
  goToResult: "Ir al resultado",
};

const translate = (key: string, values?: Record<string, unknown>) =>
  Object.entries(values ?? {}).reduce<string>(
    (copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)),
    MESSAGES[key] ?? key,
  );

/** Four taps then the result, which is the iPad guide's shape. */
const renderRail = (overrides: Partial<Parameters<typeof GuidePlaybackRail>[0]> = {}) => {
  const props = {
    frameCount: 5,
    stepCount: 4,
    frameIndex: 0,
    isPlaying: true,
    onShowPrevious: vi.fn(),
    onShowNext: vi.fn(),
    onShowFrame: vi.fn(),
    ...overrides,
  };

  return { ...render(<GuidePlaybackRail {...props} />), props };
};

describe("GuidePlaybackRail", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(translate as never);
  });

  describe("GIVEN a learner who cannot know the guide answers a gesture", () => {
    test("WHEN rendered THEN it offers a way back and a way on", () => {
      renderRail();

      expect(screen.getByRole("button", { name: MESSAGES.previous })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: MESSAGES.next })).toBeInTheDocument();
    });

    test("WHEN rendered THEN every frame has a control of its own", () => {
      // A learner who watched two frames go by wants the one they missed, not
      // one step back from wherever the loop reached.
      renderRail();

      expect(screen.getAllByRole("button")).toHaveLength(7);
    });

    test("WHEN rendered THEN the result's control is not called a step", () => {
      // There are four taps; calling its control "step 5" would number a frame
      // the learner does nothing on.
      renderRail();

      expect(screen.getByRole("button", { name: MESSAGES.goToResult })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Ir al paso 5" })).not.toBeInTheDocument();
    });

    test("WHEN rendered THEN each step's control names its number", () => {
      renderRail();

      expect(screen.getByRole("button", { name: "Ir al paso 3" })).toBeInTheDocument();
    });
  });

  describe("GIVEN the learner uses them", () => {
    test("WHEN they activate next THEN the guide is asked to move on", async () => {
      const user = userEvent.setup();
      const { props } = renderRail();

      await user.click(screen.getByRole("button", { name: MESSAGES.next }));

      expect(props.onShowNext).toHaveBeenCalledOnce();
    });

    test("WHEN they activate previous THEN the guide is asked to go back", async () => {
      const user = userEvent.setup();
      const { props } = renderRail();

      await user.click(screen.getByRole("button", { name: MESSAGES.previous }));

      expect(props.onShowPrevious).toHaveBeenCalledOnce();
    });

    test("WHEN they pick a frame THEN the guide is asked for that frame", async () => {
      const user = userEvent.setup();
      const { props } = renderRail();

      await user.click(screen.getByRole("button", { name: "Ir al paso 3" }));

      expect(props.onShowFrame).toHaveBeenCalledWith(2);
    });
  });

  describe("GIVEN a learner reading an instruction that is about to change", () => {
    test("WHEN the guide is playing THEN the frame on screen counts down", () => {
      const { container } = renderRail({ frameIndex: 2 });

      const countdown = container.querySelector('[data-slot="countdown"]');

      expect(countdown).toBeInTheDocument();
    });

    test("WHEN the guide is not playing THEN no countdown is shown", () => {
      // Under reduced motion the timer does not run, and a frozen bar reads as
      // a countdown that has stalled.
      const { container } = renderRail({ isPlaying: false });

      expect(container.querySelector('[data-slot="countdown"]')).not.toBeInTheDocument();
    });

    test("WHEN the frame changes THEN the countdown starts over", () => {
      // Keyed on the frame, so the bar cannot carry the previous frame's
      // remaining time into the new one.
      const { container, rerender } = renderRail({ frameIndex: 1 });
      const first = container.querySelector('[data-slot="countdown"]');

      rerender(
        <GuidePlaybackRail
          frameCount={5}
          stepCount={4}
          frameIndex={2}
          isPlaying
          onShowPrevious={vi.fn()}
          onShowNext={vi.fn()}
          onShowFrame={vi.fn()}
        />,
      );

      expect(container.querySelector('[data-slot="countdown"]')).not.toBe(first);
    });
  });

  describe("GIVEN the rail says where the learner is", () => {
    test("WHEN a frame is showing THEN its control is marked as the current one", () => {
      renderRail({ frameIndex: 2 });

      expect(screen.getByRole("button", { name: "Ir al paso 3" })).toHaveAttribute(
        "aria-current",
        "true",
      );
    });
  });
});
