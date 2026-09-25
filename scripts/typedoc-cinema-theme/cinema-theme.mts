import {
  DefaultTheme,
  DefaultThemeRenderContext,
  JSX,
  type ContainerReflection,
  type PageEvent,
  type Reflection,
} from "typedoc";

import { cinemaDeclarationHeader, cinemaFooter, cinemaToolbar } from "./cinema-chrome.mts";
import { cinemaHome } from "./cinema-home.mts";

/**
 * The render context for the `cinema` theme: TypeDoc's default partials with
 * the Immersion Cinema chrome swapped in.
 *
 * @remarks
 * Overrides are fields, like the partials they replace, so templates can
 * destructure them off the context. The defaults are captured first because
 * field initializers run in declaration order, after `super()`.
 */
export class CinemaThemeContext extends DefaultThemeRenderContext {
  private readonly defaultReflectionTemplate = this.reflectionTemplate;
  private readonly defaultHeader = this.header;

  override reflectionTemplate = (props: PageEvent<ContainerReflection>): JSX.Element =>
    props.model.isProject() ? cinemaHome(this, props.model) : this.defaultReflectionTemplate(props);

  override header = (props: PageEvent<Reflection>): JSX.Element => {
    if (props.model.isProject()) return JSX.createElement(JSX.Fragment, null);
    if (props.model.isDocument()) return this.defaultHeader(props);
    return cinemaDeclarationHeader(this, props);
  };

  override toolbar = (): JSX.Element => cinemaToolbar(this);

  override footer = (): JSX.Element => cinemaFooter(this);
}

/**
 * TypeDoc's default theme rendered through {@link CinemaThemeContext}.
 */
export class CinemaTheme extends DefaultTheme {
  override getRenderContext(pageEvent: PageEvent<Reflection>): CinemaThemeContext {
    return new CinemaThemeContext(this.router, this, pageEvent, this.application.options);
  }
}
