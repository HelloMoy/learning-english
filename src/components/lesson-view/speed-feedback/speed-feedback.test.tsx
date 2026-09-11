import "@testing-library/jest-dom/vitest";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SpeedFeedback } from "./speed-feedback";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * Spanish, so an indicator that falls back to English fails here instead of
 * in a learner's lesson. `rate` is the visible pill; `speedingUp` is what a
 * screen reader hears, and it is the only place the speed is said in words.
 */
const MESSAGES: Record<string, (values: { rate: number }) => string> = {
  rate: ({ rate }) => `${rate}×`,
  speedingUp: ({ rate }) => `Reproduciendo a ${rate} veces la velocidad`,
};

function aHeldRate(): number {
  return faker.helpers.arrayElement([1.5, 2, 3]);
}

describe("SpeedFeedback", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(
      ((key: string, values: { rate: number }) => MESSAGES[key]?.(values) ?? key) as never,
    );
  });

  describe("GIVEN a hold is speeding the video up", () => {
    test("WHEN rendered THEN it is a status region carrying the rate in force", () => {
      const rate = aHeldRate();

      render(<SpeedFeedback rate={rate} />);

      expect(screen.getByRole("status")).toHaveTextContent(`${rate}×`);
    });

    test("WHEN rendered THEN the direction is drawn by a right-pointing glyph, not a flipped one", () => {
      // Direction lives in the markup: a device holding a stale stylesheet
      // must still get a glyph that points the way the video is running.
      const { container } = render(<SpeedFeedback rate={aHeldRate()} />);

      expect(container.querySelector("svg.lucide-chevrons-right")).toBeInTheDocument();
      expect(container.querySelector("svg.lucide-chevrons-left")).toBeNull();
      expect(container.querySelector("[class*='rotate-']")).toBeNull();
    });

    test("WHEN rendered THEN a screen reader hears the speed in words", () => {
      const rate = aHeldRate();

      render(<SpeedFeedback rate={rate} />);

      expect(screen.getByText(`Reproduciendo a ${rate} veces la velocidad`)).toHaveClass("sr-only");
    });

    test("WHEN rendered THEN the visible rate is not read beside the spoken sentence", () => {
      const rate = aHeldRate();

      render(<SpeedFeedback rate={rate} />);

      expect(screen.getByText(`${rate}×`)).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN rendered THEN it never takes the pointer", () => {
      // The press that keeps the hold alive lands on the provider underneath;
      // an indicator that swallowed it would end the very hold it shows.
      render(<SpeedFeedback rate={aHeldRate()} />);

      expect(screen.getByRole("status")).toHaveClass("pointer-events-none");
    });
  });

  describe("GIVEN the rate is passed to the copy", () => {
    test("WHEN rendered THEN the messages receive it as a number, for the locale to format", () => {
      const translate = vi.fn((key: string) => key);
      mockUseTranslations.mockReturnValue(translate as never);
      const rate = aHeldRate();

      render(<SpeedFeedback rate={rate} />);

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.SpeedFeedback");
      expect(translate).toHaveBeenCalledWith("rate", { rate });
      expect(translate).toHaveBeenCalledWith("speedingUp", { rate });
    });
  });
});
