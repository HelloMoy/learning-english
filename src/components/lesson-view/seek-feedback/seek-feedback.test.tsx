import "@testing-library/jest-dom/vitest";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SeekFeedback } from "./seek-feedback";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * Spanish, so an indicator that falls back to English fails here instead of
 * in a learner's lesson. `seconds` is the visible count; `forward` and
 * `backward` are what a screen reader hears, and they are the only place the
 * direction is said in words — on screen the chevrons say it.
 */
const MESSAGES: Record<string, (values: { count: number }) => string> = {
  seconds: ({ count }) => (count === 1 ? "1 segundo" : `${count} segundos`),
  forward: ({ count }) => `Avanzado ${count} segundos`,
  backward: ({ count }) => `Retrocedido ${count} segundos`,
};

function tensOfSeconds(): number {
  return faker.number.int({ min: 2, max: 9 }) * 10;
}

describe("SeekFeedback", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(
      ((key: string, values: { count: number }) => MESSAGES[key]?.(values) ?? key) as never,
    );
  });

  describe("GIVEN a forward run", () => {
    test("WHEN rendered THEN it is a status region carrying the seconds the run has seeked", () => {
      const seconds = tensOfSeconds();

      render(
        <SeekFeedback
          direction="forward"
          seconds={seconds}
        />,
      );

      expect(screen.getByRole("status")).toHaveTextContent(`${seconds} segundos`);
    });

    test("WHEN rendered THEN the direction is drawn by right-pointing glyphs, not a flipped one", () => {
      // Direction lives in the markup: a device holding a stale stylesheet
      // must still get chevrons that point the way the video moved.
      const { container } = render(
        <SeekFeedback
          direction="forward"
          seconds={tensOfSeconds()}
        />,
      );

      expect(container.querySelectorAll("svg.lucide-chevron-right")).toHaveLength(3);
      expect(container.querySelectorAll("svg.lucide-chevron-left")).toHaveLength(0);
      expect(container.querySelector("[class*='rotate-']")).toBeNull();
    });

    test("WHEN rendered THEN a screen reader hears the direction in words", () => {
      const seconds = tensOfSeconds();

      render(
        <SeekFeedback
          direction="forward"
          seconds={seconds}
        />,
      );

      expect(screen.getByText(`Avanzado ${seconds} segundos`)).toHaveClass("sr-only");
    });

    test("WHEN rendered THEN the visible count is not read beside the spoken sentence", () => {
      const seconds = tensOfSeconds();

      render(
        <SeekFeedback
          direction="forward"
          seconds={seconds}
        />,
      );

      expect(screen.getByText(`${seconds} segundos`)).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN rendered THEN it sits on the forward side and never takes the pointer", () => {
      // The taps that keep a run alive land on the provider underneath; an
      // indicator that swallowed them would end the very run it shows.
      render(
        <SeekFeedback
          direction="forward"
          seconds={tensOfSeconds()}
        />,
      );

      expect(screen.getByRole("status")).toHaveAttribute("data-direction", "forward");
      expect(screen.getByRole("status")).toHaveClass("pointer-events-none");
    });
  });

  describe("GIVEN a backward run", () => {
    test("WHEN rendered THEN the glyphs point left and the spoken sentence says so", () => {
      const seconds = tensOfSeconds();

      const { container } = render(
        <SeekFeedback
          direction="backward"
          seconds={seconds}
        />,
      );

      expect(container.querySelectorAll("svg.lucide-chevron-left")).toHaveLength(3);
      expect(container.querySelectorAll("svg.lucide-chevron-right")).toHaveLength(0);
      expect(screen.getByText(`Retrocedido ${seconds} segundos`)).toHaveClass("sr-only");
      expect(screen.getByRole("status")).toHaveAttribute("data-direction", "backward");
    });
  });

  describe("GIVEN the count is passed to the copy", () => {
    test("WHEN rendered THEN the messages receive the seconds as `count`, for the ICU plural", () => {
      const translate = vi.fn((key: string) => key);
      mockUseTranslations.mockReturnValue(translate as never);
      const seconds = tensOfSeconds();

      render(
        <SeekFeedback
          direction="forward"
          seconds={seconds}
        />,
      );

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.SeekFeedback");
      expect(translate).toHaveBeenCalledWith("seconds", { count: seconds });
      expect(translate).toHaveBeenCalledWith("forward", { count: seconds });
    });
  });
});
