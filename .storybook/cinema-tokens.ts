/** The two Immersion Cinema variants declared in `src/app/globals.css`. */
export type CinemaVariant = "light" | "dark";

/** A custom property as declared: its name without the leading `--`, and its raw value. */
export type CinemaToken = readonly [name: string, value: string];

const VARIANT_SELECTOR: Record<CinemaVariant, string> = {
  light: ":root",
  dark: "\\.dark",
};

const COMMENT = /\/\*[\s\S]*?\*\//g;
const CUSTOM_PROPERTY = /--([\w-]+)\s*:\s*([^;]+);/g;

/**
 * Reads the design tokens one Immersion Cinema variant declares.
 *
 * @remarks
 * Only the top-level `:root` (light) or `.dark` (dark) rule counts. Aliases in
 * `@theme inline` and properties set by any other selector are not tokens of the
 * variant, so they are left out. Storybook uses this both to prove its manager
 * theme still matches the app and to render the Color tokens page, which is why
 * it takes the stylesheet as text rather than reading a file.
 *
 * @example
 * ```ts
 * readCinemaTokens(".dark { --gold: #e7b64c; }", "dark"); // [["gold", "#e7b64c"]]
 * ```
 *
 * @param stylesheet - The CSS source, typically `globals.css`
 * @param variant - Which variant's block to read
 * @returns The variant's tokens in source order, or none if it has no block
 */
export function readCinemaTokens(stylesheet: string, variant: CinemaVariant): CinemaToken[] {
  const body = variantBlockBody(stylesheet.replace(COMMENT, ""), variant);

  return [...body.matchAll(CUSTOM_PROPERTY)].map(([, name, value]) => [name, value.trim()]);
}

/** One colour token with its value in each Immersion Cinema variant. */
export type CinemaColorPair = { name: string; light: string; dark: string };

const HEX_COLOR = /^#[\da-f]{3,8}$/i;

/**
 * Pairs every colour token with its light and dark value, for showing both
 * palettes side by side.
 *
 * @remarks
 * Non-colour tokens such as `--radius` are left out, and so is a colour declared
 * in only one variant, since it has nothing to be compared with.
 *
 * @param stylesheet - The CSS source, typically `globals.css`
 * @returns The colour tokens in the order the light block declares them
 */
export function pairCinemaColors(stylesheet: string): CinemaColorPair[] {
  const darkByName = new Map(readCinemaTokens(stylesheet, "dark"));

  return readCinemaTokens(stylesheet, "light").flatMap(([name, light]) => {
    const dark = darkByName.get(name);

    return dark && HEX_COLOR.test(light) ? [{ name, light, dark }] : [];
  });
}

function variantBlockBody(stylesheet: string, variant: CinemaVariant): string {
  // A rule that starts the file or follows another rule's end, so `.dark` inside
  // `:is(.dark *)` or a selector list never matches.
  const topLevelRule = new RegExp(`(?:^|[;}])\\s*${VARIANT_SELECTOR[variant]}\\s*\\{([^{}]*)\\}`);

  return stylesheet.match(topLevelRule)?.[1] ?? "";
}
