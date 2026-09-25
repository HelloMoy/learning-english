import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { MESSAGES_BY_LOCALE, type SupportedLocale } from "../../i18n";
import { TypographyPage } from "./typography-page";

// Storybook's type specimen needs the docs theme; this stand-in shows the
// family and the sample text it was given.
vi.mock("@storybook/addon-docs/blocks", () => ({
  Typeset: ({ fontFamily, sampleText }: { fontFamily: string; sampleText: string }) => (
    <figure data-font={fontFamily}>{sampleText}</figure>
  ),
}));

function renderIn(locale: SupportedLocale) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES_BY_LOCALE[locale]}
    >
      <TypographyPage />
    </NextIntlClientProvider>,
  );
}

const PAGES = [
  { locale: "en", title: "Typography", sample: "Vowels: short vs. long" },
  { locale: "es", title: "Tipografía", sample: "Vocales: cortas vs. largas" },
  { locale: "pt", title: "Tipografia", sample: "Vogais: curtas vs. longas" },
] as const;

describe("TypographyPage", () => {
  it.each(PAGES)("is titled and sampled in $locale", ({ locale, title, sample }) => {
    renderIn(locale);

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(sample)).toBeInTheDocument();
  });

  it("sets its samples in the two faces the app loads", () => {
    renderIn("en");

    const families = screen.getAllByRole("figure").map((figure) => figure.dataset.font);
    expect(new Set(families)).toEqual(
      new Set(["var(--font-geist-sans)", "var(--font-geist-mono)"]),
    );
  });

  it.each(["en", "es", "pt"] as const)(
    "keeps the phonetic sample and the face names as written in %s",
    (locale) => {
      renderIn(locale);

      expect(screen.getByText("/ɪ/ vs /iː/ · 04:12")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Geist Mono" })).toBeInTheDocument();
    },
  );
});
