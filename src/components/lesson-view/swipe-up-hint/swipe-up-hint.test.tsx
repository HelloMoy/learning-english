import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SwipeUpHint } from "./swipe-up-hint";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * Spanish, so a hint that starts rendering English defaults fails here
 * instead of in a learner's lesson.
 */
const MESSAGES: Record<string, string> = {
  message: "Desliza hacia arriba para ocultar la barra del navegador y ver el video completo",
  dismiss: "Cerrar la pista",
};

describe("SwipeUpHint", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => MESSAGES[key] ?? key) as never);
  });

  describe("GIVEN the browser chrome is still on screen", () => {
    test("WHEN rendered THEN the hint is a status region carrying the localized message", () => {
      render(<SwipeUpHint />);

      expect(screen.getByRole("status")).toHaveTextContent(MESSAGES.message!);
    });

    test("WHEN rendered THEN its copy is read from the SwipeUpHint namespace", () => {
      render(<SwipeUpHint />);

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.SwipeUpHint");
    });

    test("WHEN rendered THEN the hint does not stand in the way of the swipe it asks for", () => {
      // The gesture has to reach the player and, through it, the document —
      // only the dismiss control may take the pointer.
      render(<SwipeUpHint />);

      expect(screen.getByRole("status")).toHaveClass("pointer-events-none");
      expect(screen.getByRole("button", { name: MESSAGES.dismiss })).toHaveClass(
        "pointer-events-auto",
      );
    });
  });

  describe("GIVEN a learner who already knows", () => {
    test("WHEN the dismiss control is activated THEN the hint is gone", async () => {
      const user = userEvent.setup();
      render(<SwipeUpHint />);

      await user.click(screen.getByRole("button", { name: MESSAGES.dismiss }));

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
