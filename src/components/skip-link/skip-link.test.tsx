import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SkipLink } from "./skip-link";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

describe("SkipLink", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN the link is rendered", () => {
    test("WHEN queried THEN it targets the page's main landmark", () => {
      // Act
      render(<SkipLink />);

      // Assert
      expect(screen.getByRole("link", { name: "skipToContent" })).toHaveAttribute("href", "#main");
    });
  });

  describe("GIVEN a keyboard user tabbing into the page", () => {
    test("WHEN the first Tab is pressed THEN the skip link takes focus", async () => {
      // Arrange — the link is visually hidden until focused, so reachability
      // by Tab is the entire contract.
      const user = userEvent.setup();
      render(<SkipLink />);

      // Act
      await user.tab();

      // Assert
      expect(screen.getByRole("link", { name: "skipToContent" })).toHaveFocus();
    });
  });

  describe("GIVEN the link has not been focused", () => {
    test("WHEN rendered THEN it stays screen-reader-only", () => {
      // Act
      render(<SkipLink />);

      // Assert — `sr-only` keeps it out of the visual flow without removing
      // it from the accessibility tree.
      expect(screen.getByRole("link", { name: "skipToContent" })).toHaveClass("sr-only");
    });
  });
});
