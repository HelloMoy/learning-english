import { render, screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import LocaleNotFound from "./not-found";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

describe("LocaleNotFound", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN it shows the localized heading, description, and a home link", () => {
    render(<LocaleNotFound />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "heading" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "goHome" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
