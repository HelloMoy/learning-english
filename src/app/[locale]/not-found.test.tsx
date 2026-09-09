import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";
import pt from "../../messages/pt.json";
import PageNotFound from "./not-found";

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return { ...actual, useTranslations: vi.fn() };
});

const mockUseTranslations = vi.mocked(useTranslations);

const MESSAGES = { en, es, pt } as const;

describe("PageNotFound", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(((key: string) => key) as never);
  });

  test("WHEN rendered THEN it shows the heading, the description and a home link", () => {
    render(<PageNotFound />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "heading" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "goHome" })).toHaveAttribute("href", "/");
  });

  test("WHEN it reads its copy THEN it reads the page-not-found namespace", () => {
    render(<PageNotFound />);

    expect(mockUseTranslations).toHaveBeenCalledWith("PageNotFound");
  });

  describe("GIVEN the real message catalogues", () => {
    test.each(Object.entries(MESSAGES))(
      "WHEN rendered in %s THEN the copy names the page, not the language",
      (locale, messages) => {
        // Only this page's namespace matters here, and reading it directly
        // keeps the test off the shape of the whole catalogue.
        const copy: Record<string, string> = messages.PageNotFound;
        mockUseTranslations.mockReturnValue(((key: string) => copy[key]) as never);

        render(
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
          >
            <PageNotFound />
          </NextIntlClientProvider>,
        );

        // Every request that reaches this page carries a supported locale, so
        // blaming the learner's language would be telling them to fix
        // something that is not broken.
        expect(screen.getByRole("alert").textContent).not.toMatch(
          /not supported|no soportado|não suportado/i,
        );
        expect(screen.getByRole("heading").textContent).toMatch(
          /page not found|página no encontrada|página não encontrada/i,
        );
      },
    );
  });
});
