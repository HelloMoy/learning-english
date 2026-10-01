import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { MESSAGES_BY_LOCALE, type SupportedLocale } from "../../i18n";
import { ColorTokensPage } from "./color-tokens-page";

// Storybook's swatch blocks need the docs theme; this stand-in lists what each
// row was given, which is all this page decides.
vi.mock("@storybook/addon-docs/blocks", () => ({
  ColorPalette: ({ children }: { children: React.ReactNode }) => <dl>{children}</dl>,
  ColorItem: ({ title, colors }: { title: string; colors: Record<string, string> }) => (
    <div>
      <dt>{title}</dt>
      {Object.entries(colors).map(([label, value]) => (
        <dd key={label}>{`${label}: ${value}`}</dd>
      ))}
    </div>
  ),
}));

const STYLESHEET = `
:root { --background: #f6f1e6; --gold: #8a5e0f; --radius: 0.625rem; }
.dark { --background: #08080b; --gold: #e7b64c; }
`;

function renderIn(locale: SupportedLocale) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES_BY_LOCALE[locale]}
    >
      <ColorTokensPage stylesheet={STYLESHEET} />
    </NextIntlClientProvider>,
  );
}

const TITLES = [
  { locale: "en", title: "Color tokens", light: "Light", dark: "Dark" },
  { locale: "es", title: "Tokens de color", light: "Claro", dark: "Oscuro" },
  { locale: "pt", title: "Tokens de cor", light: "Claro", dark: "Escuro" },
] as const;

describe("ColorTokensPage", () => {
  it.each(TITLES)("is titled and labelled in $locale", ({ locale, title, light, dark }) => {
    renderIn(locale);

    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(`${light}: #f6f1e6`)).toBeInTheDocument();
    expect(screen.getByText(`${dark}: #08080b`)).toBeInTheDocument();
  });

  it("shows one row per colour token, read from the stylesheet it is given", () => {
    renderIn("en");

    expect(screen.getAllByRole("term").map((row) => row.textContent)).toEqual([
      "--background",
      "--gold",
    ]);
  });

  it.each(["en", "es", "pt"] as const)("keeps token names as code in %s", (locale) => {
    renderIn(locale);

    expect(screen.getByText("src/app/globals.css").tagName).toBe("CODE");
  });
});
