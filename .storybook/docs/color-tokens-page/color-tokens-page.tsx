import { ColorItem, ColorPalette } from "@storybook/addon-docs/blocks";
import { useTranslations } from "next-intl";

import { pairCinemaColors } from "../../cinema-tokens";

const code = (chunks: React.ReactNode) => <code>{chunks}</code>;

/**
 * `Docs/Color tokens`: both Immersion Cinema palettes side by side, one row per
 * colour token.
 *
 * @param stylesheet - The CSS the swatches are read from; the MDX page passes
 *   `globals.css` as text, so the page never shows a value the app does not ship.
 */
export function ColorTokensPage({ stylesheet }: { stylesheet: string }) {
  const t = useTranslations("Stories.Docs.ColorTokens");

  return (
    <div className="cinema-docs">
      <header className="cinema-docs__hero">
        <h1 className="cinema-docs__page-title">{t("title")}</h1>
        <p className="cinema-docs__body">{t.rich("intro", { code })}</p>
        <p className="cinema-docs__body">{t.rich("usage", { code })}</p>
        <p className="cinema-docs__body">{t.rich("exceptions", { code })}</p>
      </header>
      <ColorPalette>
        {pairCinemaColors(stylesheet).map(({ name, light, dark }) => (
          <ColorItem
            key={name}
            title={`--${name}`}
            subtitle={light === dark ? t("same") : ""}
            colors={{ [t("light")]: light, [t("dark")]: dark }}
          />
        ))}
      </ColorPalette>
    </div>
  );
}
