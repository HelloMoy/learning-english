import { act, render, screen } from "@testing-library/react";
import { useLocale } from "next-intl";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { describe, expect, it, vi } from "vitest";

import { CinemaDocsContainer } from "./cinema-docs-container";
import { cinemaLightTheme, cinemaTheme } from "./cinema-theme";

// The real container needs a live docs context; this stand-in only has to show
// where the page's content ends up and which theme it was handed.
vi.mock("@storybook/addon-docs/blocks", () => ({
  DocsContainer: ({ children, theme }: { children: React.ReactNode; theme: unknown }) => (
    <main
      aria-label="Docs page"
      data-theme-base={(theme as { base?: string } | undefined)?.base}
    >
      {children}
    </main>
  ),
}));

type Globals = Record<string, unknown>;

function fakeDocsContext(globals?: Globals) {
  const listeners = new Map<string, (payload: unknown) => void>();
  const channel = {
    on: (event: string, listener: (payload: unknown) => void) => listeners.set(event, listener),
    off: (event: string) => listeners.delete(event),
    emit: (event: string, payload: unknown) => listeners.get(event)?.(payload),
  };
  const store = globals ? { userGlobals: { get: () => globals } } : undefined;
  return { context: { channel, store } as never, channel };
}

function PageLocale() {
  return <p>Locale: {useLocale()}</p>;
}

function renderDocsPage(globals?: Globals) {
  const { context, channel } = fakeDocsContext(globals);
  const view = render(
    <CinemaDocsContainer context={context}>
      <h1>Color tokens</h1>
      <PageLocale />
    </CinemaDocsContainer>,
  );
  return { ...view, channel, page: () => screen.getByRole("main", { name: "Docs page" }) };
}

describe("CinemaDocsContainer", () => {
  it("renders the docs page it wraps", () => {
    const { page } = renderDocsPage({ theme: "dark", locale: "en" });

    expect(page()).toContainElement(screen.getByRole("heading", { name: "Color tokens" }));
  });

  it("paints the app's cinema backdrop behind the page", () => {
    const { container } = renderDocsPage({ theme: "dark", locale: "en" });

    expect(container.querySelector('[aria-hidden="true"].fixed.inset-0')).toBeInTheDocument();
  });

  it("scopes the page in the dark tokens and the dark docs theme while the toolbar is dark", () => {
    const { container, page } = renderDocsPage({ theme: "dark", locale: "en" });

    expect(container.firstElementChild).toHaveClass("dark");
    expect(page()).toHaveAttribute("data-theme-base", cinemaTheme.base);
  });

  it("drops the dark scope and uses the light docs theme while the toolbar is light", () => {
    const { container, page } = renderDocsPage({ theme: "light", locale: "en" });

    expect(container.firstElementChild).not.toHaveClass("dark");
    expect(page()).toHaveAttribute("data-theme-base", cinemaLightTheme.base);
  });

  it("moves <html> to the picked theme, as the canvas decorator does for stories", () => {
    document.documentElement.classList.add("dark");

    const { channel } = renderDocsPage({ theme: "light", locale: "en" });
    expect(document.documentElement).not.toHaveClass("dark");

    act(() => channel.emit(GLOBALS_UPDATED, { globals: { theme: "dark", locale: "en" } }));
    expect(document.documentElement).toHaveClass("dark");
  });

  it.each(["en", "es", "pt"])(
    "gives the page the %s messages when that locale is picked",
    (locale) => {
      renderDocsPage({ theme: "dark", locale });

      expect(screen.getByText(`Locale: ${locale}`)).toBeInTheDocument();
    },
  );

  it("falls back to the toolbar defaults when the context carries no globals", () => {
    const { container } = renderDocsPage();

    expect(container.firstElementChild).toHaveClass("dark");
    expect(screen.getByText("Locale: en")).toBeInTheDocument();
  });

  it("ignores a locale the app does not support", () => {
    renderDocsPage({ theme: "dark", locale: "fr" });

    expect(screen.getByText("Locale: en")).toBeInTheDocument();
  });

  it("follows the toolbar when its globals change on the open page", () => {
    const { container, channel } = renderDocsPage({ theme: "dark", locale: "en" });

    act(() => channel.emit(GLOBALS_UPDATED, { globals: { theme: "light", locale: "pt" } }));

    expect(container.firstElementChild).not.toHaveClass("dark");
    expect(screen.getByText("Locale: pt")).toBeInTheDocument();
  });
});
