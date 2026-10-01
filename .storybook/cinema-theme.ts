import type { ThemeVarsColors } from "storybook/theming";
import { create } from "storybook/theming/create";

type ColorKey = {
  [Key in keyof ThemeVarsColors]-?: ThemeVarsColors[Key] extends string ? Key : never;
}[keyof ThemeVarsColors];

/**
 * Which Immersion Cinema token each colour of {@link cinemaTheme} and
 * {@link cinemaLightTheme} is taken from, by token name without the leading `--`.
 *
 * @remarks
 * The manager is bundled apart from the preview and never loads `globals.css`,
 * so the themes have to carry literal colours. This table is what keeps them
 * honest: `cinema-theme.test.ts` reads `globals.css` and fails when any value no
 * longer matches its token in the theme's variant.
 */
export const CINEMA_THEME_TOKENS = {
  appBg: "sidebar",
  barBg: "sidebar",
  appContentBg: "background",
  appPreviewBg: "background",
  appHoverBg: "secondary",
  appBorderColor: "border",
  colorPrimary: "gold",
  colorSecondary: "bronze",
  barSelectedColor: "gold",
  barHoverColor: "amber",
  barTextColor: "muted-foreground",
  textColor: "foreground",
  textMutedColor: "muted-foreground",
  // Text set on a surface of the opposite lightness, so the surface colour.
  textInverseColor: "card",
  buttonBg: "card",
  buttonBorder: "border",
  booleanBg: "secondary",
  booleanSelectedBg: "accent",
  inputBg: "card",
  inputBorder: "border",
  inputTextColor: "foreground",
} as const satisfies Partial<Record<ColorKey, string>>;

type CinemaToken = (typeof CINEMA_THEME_TOKENS)[keyof typeof CINEMA_THEME_TOKENS];
type CinemaVariant = "light" | "dark";

// Literal copies of the tokens the table names, per variant (see the table's
// remarks for why they cannot be read from `globals.css`).
const PALETTES: Record<CinemaVariant, Record<CinemaToken, string>> = {
  dark: {
    sidebar: "#0d0e12",
    background: "#08080b",
    secondary: "#1f2029",
    border: "#26262f",
    gold: "#e7b64c",
    // Storybook fills the selected sidebar item with `colorSecondary` darkened
    // 18%, under white text. Gold would leave that text near 3:1; bronze clears AA.
    bronze: "#c08a5a",
    amber: "#f0c869",
    "muted-foreground": "#9b968c",
    foreground: "#f4f1ea",
    card: "#16171d",
    accent: "#26262f",
  },
  light: {
    sidebar: "#efe7d6",
    background: "#f6f1e6",
    secondary: "#ece3d1",
    border: "#e2d8c4",
    gold: "#8a5e0f",
    bronze: "#a06a3a",
    amber: "#c8912a",
    "muted-foreground": "#5c5344",
    foreground: "#1c1710",
    card: "#fffdf6",
    accent: "#ece3d1",
  },
};

const GOLD = PALETTES.dark.gold;
const RADIUS_PX = 10;

const WORDMARK =
  '<span style="font-weight:800;letter-spacing:0.24em;white-space:nowrap">' +
  `ENGLISH<span style="color:${GOLD};padding:0 0.12em">·</span>COURSE` +
  "</span>";

// The same gold tag the API reference hangs beside the wordmark ("API"), so the
// two tools read as parts of one product.
const DESIGN_SYSTEM_TAG =
  '<span style="' +
  "padding:4px 8px 4px 10px;border-radius:6px;" +
  `border:1px solid color-mix(in oklab, ${GOLD} 40%, transparent);` +
  `background:color-mix(in oklab, ${GOLD} 10%, transparent);` +
  `color:${GOLD};font-size:10px;font-weight:700;letter-spacing:0.28em;` +
  'text-transform:uppercase;white-space:nowrap">Design system</span>';

// Wraps the tag under the wordmark when the sidebar is too narrow for both.
const BRAND =
  '<span style="display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px 12px">' +
  WORDMARK +
  DESIGN_SYSTEM_TAG +
  "</span>";

function createCinemaTheme(variant: CinemaVariant) {
  const palette = PALETTES[variant];
  const colors = Object.fromEntries(
    Object.entries(CINEMA_THEME_TOKENS).map(([themeKey, token]) => [themeKey, palette[token]]),
  ) as Record<keyof typeof CINEMA_THEME_TOKENS, string>;

  return create({
    base: variant,
    brandTitle: BRAND,
    fontBase: '"Geist", ui-sans-serif, system-ui, sans-serif',
    fontCode: '"Geist Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
    appBorderRadius: RADIUS_PX,
    inputBorderRadius: RADIUS_PX,
    ...colors,
  });
}

/**
 * Immersion Cinema dark, as a Storybook theme.
 *
 * @remarks
 * Registered for the manager in `manager.ts`, which is always dark, and used by
 * `CinemaDocsContainer` for docs pages while the toolbar theme is dark. Colours
 * map to tokens through {@link CINEMA_THEME_TOKENS}; `--radius` (0.625rem)
 * becomes 10px.
 */
export const cinemaTheme = createCinemaTheme("dark");

/**
 * Immersion Cinema light, as a Storybook theme: the same mapping as
 * {@link cinemaTheme}, over the `:root` tokens. Used by `CinemaDocsContainer`
 * for docs pages while the toolbar theme is light.
 */
export const cinemaLightTheme = createCinemaTheme("light");
