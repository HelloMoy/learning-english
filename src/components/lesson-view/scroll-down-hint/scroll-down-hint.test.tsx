import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ScrollDownHint } from "./scroll-down-hint";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * Spanish, so a hint that starts rendering English defaults fails here
 * instead of in a learner's lesson. The two messages are deliberately not the
 * same sentence: the visible one names the outcome and says nothing about
 * direction — an arrow does that — while the spoken one has to say it in
 * words, because an arrow states nothing to a screen reader.
 */
const MESSAGES: Record<string, string> = {
  message: "Baja para pantalla completa",
  screenReaderMessage: "Desplázate hacia abajo para ver el video en pantalla completa.",
  dismiss: "Cerrar la pista",
};

describe("ScrollDownHint", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN the browser chrome is still on screen", () => {
    test("WHEN rendered THEN the hint is a status region carrying the localized message", () => {
      render(<ScrollDownHint />);

      expect(screen.getByRole("status")).toHaveTextContent(MESSAGES.message!);
    });

    test("WHEN rendered THEN what a screen reader hears names the direction", () => {
      // The visible copy names only the outcome, so this sentence is the one
      // place the direction survives for anyone who cannot see the arrow.
      render(<ScrollDownHint />);

      expect(screen.getByRole("status")).toHaveTextContent(MESSAGES.screenReaderMessage!);
      expect(screen.getByText(MESSAGES.screenReaderMessage!)).toHaveClass("sr-only");
    });

    test("WHEN rendered THEN the visible line is not announced beside the spoken one", () => {
      // Both live in the same status region; without this the promise is read
      // twice, once stripped of its direction and once with it.
      render(<ScrollDownHint />);

      expect(screen.getByText(MESSAGES.message!)).toHaveAttribute("aria-hidden", "true");
    });

    test("WHEN rendered THEN the visible line holds one line", () => {
      // The hint covers the video the learner just enlarged. Three or four
      // words fit the long side of a phone; a wrap means a locale's copy grew
      // past what this hint is for.
      render(<ScrollDownHint />);

      expect(screen.getByText(MESSAGES.message!)).toHaveClass("whitespace-nowrap");
    });

    test("WHEN rendered THEN its copy is read from the ScrollDownHint namespace", () => {
      render(<ScrollDownHint />);

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.ScrollDownHint");
    });

    test("WHEN rendered THEN the hint does not stand in the way of the swipe it asks for", () => {
      // The gesture has to reach the player and, through it, the document —
      // only the dismiss control may take the pointer.
      render(<ScrollDownHint />);

      expect(screen.getByRole("status")).toHaveClass("pointer-events-none");
      expect(screen.getByRole("button", { name: MESSAGES.dismiss })).toHaveClass(
        "pointer-events-auto",
      );
    });
  });

  describe("GIVEN the hint has just appeared", () => {
    test("WHEN it enters THEN it comes from the edge the gesture points at", () => {
      // The pill travels down into place, which states the axis of the swipe
      // before the arrow has said anything.
      render(<ScrollDownHint />);

      expect(screen.getByRole("status")).toHaveClass(
        "animate-in",
        "fade-in",
        "slide-in-from-top-2",
      );
    });

    test("WHEN the learner asks for reduced motion THEN the entrance does not play", () => {
      render(<ScrollDownHint />);

      expect(screen.getByRole("status")).toHaveClass("motion-reduce:animate-none");
    });
  });

  describe("GIVEN the arrow is the only thing naming the direction", () => {
    const arrowOf = (container: HTMLElement) =>
      container.querySelector('[data-slot="scroll-direction-arrow"]');

    test("WHEN the hint is shown THEN the glyph itself points down", () => {
      // Down: the page scrolls down, even though the finger travels up. The
      // arrow commits to the page, and the copy's verb commits with it.
      //
      // Asserted on the drawn glyph, not on a class. A device that picks up new
      // JS while holding a cached stylesheet must still get a downward arrow —
      // an upward one beside this copy is the exact defect being fixed, and a
      // class-based flip lets a stale stylesheet reintroduce it.
      const { container } = render(<ScrollDownHint />);

      expect(arrowOf(container)).toHaveClass("lucide-arrow-down");
      expect(arrowOf(container)).not.toHaveClass("rotate-180");
    });

    test("WHEN the hint is shown THEN the arrow travels the way it points", () => {
      // A still arrow beside a sentence reads as an ornament. The travel is
      // what turns it back into an instruction, and it goes the way the glyph
      // does — `arrow-drop` is `bounce` mirrored, since `bounce` travels up.
      const { container } = render(<ScrollDownHint />);

      expect(arrowOf(container)).toHaveClass("animate-arrow-drop");
    });

    test("WHEN the gesture has been demonstrated THEN the travel ends on its own", () => {
      // Bounded, and bounded on a half iteration: `arrow-drop` holds the
      // displaced position at both ends of a whole cycle, so stopping on one
      // would drop the arrow into place in a single frame. The half lands on
      // the resting keyframe, where the base style already is.
      //
      // Six and a half of them, not four and a half: a learner spends the first
      // seconds of the enlarged video looking at the video.
      const { container } = render(<ScrollDownHint />);

      expect(arrowOf(container)).toHaveClass("repeat-[6.5]");
    });

    test("WHEN the learner asks for reduced motion THEN the arrow holds still", () => {
      const { container } = render(<ScrollDownHint />);

      expect(arrowOf(container)).toHaveClass("motion-reduce:animate-none");
    });

    test("WHEN the hint is announced THEN the arrow is not part of what is read", () => {
      const { container } = render(<ScrollDownHint />);

      expect(arrowOf(container)).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("GIVEN a learner who already knows", () => {
    test("WHEN the dismiss control is activated THEN the hint is gone", async () => {
      const user = userEvent.setup();
      render(<ScrollDownHint />);

      await user.click(screen.getByRole("button", { name: MESSAGES.dismiss }));

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
