import { render, screen, within } from "@testing-library/react";
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

// The path line reads the locale and the pathname from context this file does
// not set up; its own test covers what it says. Here it only has to be placed.
vi.mock("./missing-path", () => ({
  MissingPath: () => <p>missing-path</p>,
}));

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

  test("WHEN rendered THEN the eyebrow names the error above the heading", () => {
    render(<PageNotFound />);

    const eyebrow = screen.getByText("eyebrow");
    const heading = screen.getByRole("heading", { level: 1 });

    expect(eyebrow.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test("WHEN rendered THEN the alert names the missing path", () => {
    render(<PageNotFound />);

    expect(within(screen.getByRole("alert")).getByText("missing-path")).toBeInTheDocument();
  });

  test("WHEN rendered THEN the course lobby is the second way out", () => {
    render(<PageNotFound />);

    const [first, second] = screen.getAllByRole("link");

    expect(first).toHaveAccessibleName("goHome");
    expect(second).toHaveAccessibleName("viewCourses");
    expect(second).toHaveAttribute("href", "/courses");
  });

  test("WHEN rendered THEN the skip link's target is the page's main landmark", () => {
    render(<PageNotFound />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  test("WHEN rendered THEN no colour comes from outside the theme", () => {
    const { container } = render(<PageNotFound />);

    // `slate-*` is what this page wore before it joined the theme; the tokens
    // are what follow the light and dark variants.
    expect(container.innerHTML).not.toMatch(/slate-/);
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

    test.each(Object.entries(MESSAGES))(
      "WHEN %s is read THEN it names the error, the missing path and the course lobby",
      (_locale, messages) => {
        const copy: Record<string, string> = messages.PageNotFound;

        expect(copy.eyebrow).toMatch(/404/);
        // The path sits inside the sentence, wherever the language puts it.
        expect(copy.missingPath).toContain("<requested>{path}</requested>");
        expect(copy.viewCourses).toMatch(/courses|cursos/i);
      },
    );
  });
});
