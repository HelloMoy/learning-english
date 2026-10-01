import type { Application } from "typedoc";

import { CinemaTheme } from "./cinema-theme.mts";

/** The name `typedoc.json` selects the theme by. */
export const CINEMA_THEME_NAME = "cinema";

/**
 * TypeDoc plugin entry point: registers the Immersion Cinema theme so the API
 * reference looks like the app it documents.
 *
 * @param app - The TypeDoc application loading this plugin.
 */
export function load(app: Application): void {
  app.renderer.defineTheme(CINEMA_THEME_NAME, CinemaTheme);
}
