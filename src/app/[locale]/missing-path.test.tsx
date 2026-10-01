import { usePathname } from "@/i18n/navigation";

import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test, vi } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";
import pt from "../../messages/pt.json";
import { MissingPath } from "./missing-path";

const MESSAGES = { en, es, pt } as const;
type Locale = keyof typeof MESSAGES;

const SENTENCE_START: Record<Locale, string> = {
  en: "There's nothing at",
  es: "No hay nada en",
  pt: "Não há nada em",
};

function renderMissingPath(locale: Locale, pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname as never);

  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
    >
      <MissingPath />
    </NextIntlClientProvider>,
  );
}

describe("MissingPath", () => {
  test.each(Object.keys(MESSAGES) as Locale[])(
    "WHEN a path is missing under %s THEN the sentence names it with its locale",
    (locale) => {
      const slug = faker.lorem.slug();

      const { container } = renderMissingPath(locale, `/${slug}`);

      expect(container.textContent).toBe(`${SENTENCE_START[locale]} /${locale}/${slug}`);
    },
  );

  test("WHEN the path is percent-encoded THEN it stays encoded", () => {
    renderMissingPath("en", "/call%20this%20number");

    expect(screen.getByText("/en/call%20this%20number")).toBeInTheDocument();
    expect(screen.queryByText(/call this number/)).not.toBeInTheDocument();
  });

  test("WHEN the path is very long THEN it wraps and is clamped to two lines", () => {
    const { container } = renderMissingPath("es", `/${faker.string.alphanumeric(600)}`);

    // Tailwind's own names for the two behaviours: an unbroken path has no
    // spaces to wrap at, and without the clamp it would bury the actions.
    expect(container.firstElementChild).toHaveClass("break-all", "line-clamp-2");
  });
});
