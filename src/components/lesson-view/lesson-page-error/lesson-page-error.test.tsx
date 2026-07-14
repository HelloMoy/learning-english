import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonPageError } from "./lesson-page-error";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  // The Link component from @/i18n/navigation is not exercised here; the
  // anchor it renders is observable via getByRole.
}));

const mockUseTranslations = vi.mocked(useTranslations);

describe("LessonPageError", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered for module-not-in-course THEN it shows the module-specific message", () => {
    render(<LessonPageError kind="module-not-in-course" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("errorModuleNotInCourse")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "goHome" })).toBeInTheDocument();
  });

  test("WHEN rendered for lesson-not-in-module THEN it shows the lesson-specific message", () => {
    render(<LessonPageError kind="lesson-not-in-module" />);

    expect(screen.getByText("errorLessonNotInModule")).toBeInTheDocument();
  });

  test("WHEN rendered for invalid-params THEN it shows the lesson-not-in-module message (fallback)", () => {
    render(<LessonPageError kind="invalid-params" />);

    expect(screen.getByText("errorLessonNotInModule")).toBeInTheDocument();
  });
});
