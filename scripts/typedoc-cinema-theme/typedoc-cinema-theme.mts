import { Converter, type Application } from "typedoc";

import { CinemaTheme } from "./cinema-theme.mts";
import { applyReleaseVersion } from "./release-version.mts";

/** The name `typedoc.json` selects the theme by. */
export const CINEMA_THEME_NAME = "cinema";

/**
 * TypeDoc plugin entry point: registers the Immersion Cinema theme so the API
 * reference looks like the app it documents, and names the project after the
 * release git reports.
 *
 * @param app - The TypeDoc application loading this plugin.
 */
export function load(app: Application): void {
  app.renderer.defineTheme(CINEMA_THEME_NAME, CinemaTheme);
  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => applyReleaseVersion(context.project));
}
