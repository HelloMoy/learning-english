import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { MESSAGES_BY_LOCALE, type SupportedLocale } from "../../i18n";
import { WelcomePage } from "./welcome-page";

function renderIn(locale: SupportedLocale) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES_BY_LOCALE[locale]}
    >
      <WelcomePage />
    </NextIntlClientProvider>,
  );
}

const HEADLINES = [
  { locale: "en", headline: "The design system for English Course.", accent: "design system" },
  {
    locale: "es",
    headline: "El sistema de diseño de English Course.",
    accent: "sistema de diseño",
  },
  { locale: "pt", headline: "O sistema de design do English Course.", accent: "sistema de design" },
] as const;

describe("WelcomePage", () => {
  it.each(HEADLINES)(
    "presents itself as the design system in $locale, the phrase set in gold",
    ({ locale, headline, accent }) => {
      renderIn(locale);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(headline);
      expect(within(heading).getByText(accent)).toHaveClass("cinema-docs__title-accent");
    },
  );

  it.each(["en", "es", "pt"] as const)(
    "names the four sidebar groups by prefix in %s",
    (locale) => {
      renderIn(locale);

      for (const prefix of ["Cinema/", "LessonView/", "Components/", "UI/"]) {
        expect(screen.getByText(prefix)).toBeInTheDocument();
      }
    },
  );

  it.each(["en", "es", "pt"] as const)(
    "keeps file names as code in %s while the sentence around them is translated",
    (locale) => {
      renderIn(locale);

      expect(screen.getByText("poster-card.stories.tsx").tagName).toBe("CODE");
    },
  );

  it("translates the rest of the page, not only the headline", () => {
    renderIn("es");

    expect(screen.getByRole("heading", { name: "Antes de publicar un componente" })).toBeVisible();
    expect(screen.queryByText("Before a component ships")).not.toBeInTheDocument();
  });
});
