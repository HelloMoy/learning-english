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
 * same sentence: the visible one carries only the gesture, since gesture and
 * outcome together do not hold one line at a phone's width, while the spoken
 * one carries the outcome too — an arrow states nothing to a screen reader,
 * and the sentence it hears is where nothing may be dropped.
 */
const MESSAGES: Record<string, string> = {
  message: "Arroja el video hacia arriba",
  screenReaderMessage: "Arroja el video hacia arriba para verlo en pantalla completa.",
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

    test("WHEN rendered THEN what a screen reader hears names the outcome too", () => {
      // The visible copy carries only the gesture, so this sentence is the one
      // place the full screen it earns survives for anyone who cannot see the
      // arrow.
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
    test("WHEN it enters THEN it travels the way the gesture goes", () => {
      // The pill lifts into place, which states the axis of the gesture before
      // the arrow has said anything. Only the eight pixels of entrance travel
      // reverse — the pill still rests against the player's top edge.
      render(<ScrollDownHint />);

      expect(screen.getByRole("status")).toHaveClass(
        "animate-in",
        "fade-in",
        "slide-in-from-bottom-2",
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

    test("WHEN the hint is shown THEN the glyph itself points up", () => {
      // Up: the way the finger goes. The page travels the other way, but the
      // page is covered by the backdrop and the learner never sees it move —
      // so the arrow commits to the hand, and the copy's verb commits with it.
      //
      // Asserted on the drawn glyph, not on a class. A device that picks up new
      // JS while holding a cached stylesheet must still get an upward arrow —
      // a downward one beside this copy is the exact defect being fixed, and a
      // class-based flip lets a stale stylesheet reintroduce it.
      const { container } = render(<ScrollDownHint />);

      expect(arrowOf(container)).toHaveClass("lucide-arrow-up");
      expect(arrowOf(container)).not.toHaveClass("rotate-180");
    });

    test("WHEN the hint is shown THEN the arrow travels the way it points", () => {
      // A still arrow beside a sentence reads as an ornament. The travel is
      // what turns it back into an instruction, and it goes the way the glyph
      // does — `arrow-lift` travels up, like the finger.
      //
      // A name of its own, not a redefined `arrow-drop`: a phone holding the
      // old stylesheet finds no such utility and leaves the arrow still, which
      // is the failure this component accepts. Reusing the name would have that
      // phone run downward travel beside an upward glyph.
      const { container } = render(<ScrollDownHint />);

      expect(arrowOf(container)).toHaveClass("animate-arrow-lift");
    });

    test("WHEN the gesture has been demonstrated THEN the travel ends on its own", () => {
      // Bounded, and bounded on a half iteration: `arrow-lift` holds the
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
