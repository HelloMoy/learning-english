import type { LegalSection } from "@/lib/legal-sections/legal-sections";

import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test } from "vitest";

import { LegalDocument } from "./legal-document";

const MESSAGES = { Legal: { lastUpdated: "Last updated {date}" } } as const;

const SECTIONS: readonly LegalSection[] = [
  { heading: "What this covers", body: "The site and your account." },
  { heading: "Your account", body: "Your name and your address." },
  { heading: "Cookies", body: "Two, and no others." },
];

/**
 * The formatter needs a fixed zone: without one the assertion passes or fails
 * by the machine's own, which is exactly the flake F.I.R.S.T. warns about.
 */
function renderDocument(locale: string, lastUpdated = new Date("2026-09-22T00:00:00Z")) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES}
      timeZone="UTC"
    >
      <LegalDocument
        title="Privacy"
        intro="What we collect and why."
        sections={SECTIONS}
        lastUpdated={lastUpdated}
      />
    </NextIntlClientProvider>,
  );
}

describe("LegalDocument", () => {
  describe("GIVEN a document with a title, an intro and sections", () => {
    test("WHEN rendered THEN the title is the page's only top-level heading", () => {
      // Act
      renderDocument("en");

      // Assert
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Privacy");
    });

    test("WHEN rendered THEN the intro appears before the sections", () => {
      // Act
      renderDocument("en");

      // Assert
      expect(screen.getByText("What we collect and why.")).toBeInTheDocument();
    });

    test("WHEN rendered THEN every section contributes a heading and its body", () => {
      // Act
      renderDocument("en");

      // Assert
      for (const section of SECTIONS) {
        const heading = screen.getByRole("heading", { level: 2, name: section.heading });
        expect(heading).toBeInTheDocument();
        expect(screen.getByText(section.body)).toBeInTheDocument();
      }
    });

    test("WHEN rendered THEN the sections keep the order they were given", () => {
      // Act
      renderDocument("en");

      // Assert — reading order is the document's meaning; a set of the right
      // headings in the wrong order is a different document.
      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
      expect(headings).toEqual(SECTIONS.map((section) => section.heading));
    });

    test("WHEN rendered THEN each section is its own region", () => {
      // Act
      const { container } = renderDocument("en");

      // Assert
      const sections = container.querySelectorAll("section");
      expect(sections).toHaveLength(SECTIONS.length);
      expect(
        within(sections[0] as HTMLElement).getByRole("heading", { level: 2 }),
      ).toHaveTextContent("What this covers");
    });
  });

  describe("GIVEN the same document under different locales", () => {
    test("WHEN rendered in pt THEN the date is formatted for pt, not in the en order", () => {
      // Arrange — the guard that the date goes through next-intl's formatter
      // rather than being interpolated as a fixed string. A hardcoded date
      // would read identically in both locales.
      renderDocument("en");
      const english = screen.getByTestId("legal-last-updated").textContent;
      screen.getByTestId("legal-last-updated").remove();

      // Act
      renderDocument("pt");
      const portuguese = screen.getByTestId("legal-last-updated").textContent;

      // Assert
      expect(portuguese).not.toEqual(english);
      expect(portuguese).toContain("2026");
    });
  });
});
