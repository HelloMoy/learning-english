import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { InlineLessonNotes } from "./inline-lesson-notes";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

describe("InlineLessonNotes", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("renders a localized Notes heading and the rendered Markdown body", () => {
    const markdown = ["# Welcome", "", "Lesson body."].join("\n");
    render(<InlineLessonNotes markdown={markdown} />);
    expect(screen.getByTestId("inline-lesson-notes")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "heading" })).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
    expect(screen.getByText("Lesson body.")).toBeInTheDocument();
  });

  test("does not render raw HTML embedded in the Markdown body", () => {
    const { container } = render(
      <InlineLessonNotes markdown="Hello <script>alert('xss')</script>" />,
    );
    expect(container.querySelector("script")).toBeNull();
  });
});
