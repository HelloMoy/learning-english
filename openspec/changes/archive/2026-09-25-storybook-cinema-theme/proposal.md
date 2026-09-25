## Why

Storybook is where this project reviews every component, yet it looks like a stock Storybook and
not like English·Course. The manager (sidebar, toolbar, addon panel) uses Storybook's default light
theme, the stories open in the **light** variant while the app opens in **dark** (the
`cinema-theme-tokens` spec makes dark the default), and the canvas behind a story is a flat colour
instead of the Immersion Cinema backdrop every page of the app is painted on. A reviewer therefore
judges components against a background and a theme the learner never sees. There is also no
landing page: Storybook opens on whatever story sorts first.

The approved mock is at https://claude.ai/artifact/QTjczy49nryjs6YUuwA3hB.

## What Changes

- The Storybook manager is themed as Immersion Cinema dark: its colours, radii and fonts come from
  the `.dark` tokens in `src/app/globals.css`, and its brand is the `ENGLISH·COURSE` wordmark with
  the gold middle dot.
- The manager theme cannot drift from the app: a test fails when a colour in the theme no longer
  matches the `.dark` token it was taken from.
- Stories open in the dark variant by default. The light/dark toolbar switch keeps working.
- In the story canvas, a story is rendered over the same cinema backdrop the app renders
  (`CinemaBackground`: warm glow plus letterbox scrim), in whichever variant is selected. The
  backgrounds picker, whose white and `#0a0a0a` swatches would paint over it, is turned off.
- Docs pages sit on the cinema backdrop and obey the toolbar like a story does: the theme switch
  moves them between cinema-dark and cinema-light, and the locale switch shows their copy in
  English, Spanish or Portuguese. A control that changes its label and nothing else would read
  as broken.
- Three docs pages are added under a `Docs/` group that sorts first, so Storybook opens on the
  first one:
  - `Docs/Welcome`: announces itself as the design system for English Course, the way the
    TypeDoc home announces the API reference, then shows how the sidebar groups components
    (`Cinema/`, `LessonView/`, `Components/`, `UI/`) and the four things a component needs before
    it ships.
  - `Docs/Color tokens`: the light and dark palettes, read from `globals.css` at build time, so
    the page cannot show a stale value.
  - `Docs/Typography`: Geist and Geist Mono, the two faces the app loads.

## Capabilities

### New Capabilities

- `storybook-workshop-theme`: how the Storybook manager, canvas and docs pages present themselves:
  cinema-dark manager theme kept in step with the app tokens, dark as the stories' default
  variant, the cinema backdrop in the canvas, and the `Docs/` landing pages.

### Modified Capabilities

_None._ `storybook-preview-integrity` covers whether a story can render at all; this change
leaves those guarantees as they are.

## Non-goals

- Changing any application component or its styles. The tokens in `globals.css` are read, never
  edited. The only story edit is removing the `backgrounds` parameter from the seven `Cinema/`
  stories, which does nothing once the picker is off.
- A light theme for the manager. The manager is always cinema-dark; the story canvas and the docs
  pages follow the light/dark switch.
- Translating the sidebar entries (`Docs/Welcome`, …). They belong to the manager, which has no
  locale. The pages themselves follow the locale switch.
- Live story counts on the Welcome page. The mock showed them; a hand-written number goes stale
  with the next story, so the page names the groups without counting them.
- Re-enabling the Vitest addon panel or changing the preview's module stubs.

## Impact

- `.storybook/`: new theme module (dark and light) and `manager.ts`, `manager-head.html` for the
  fonts, a canvas backdrop decorator, a docs container that follows the toolbar, a token reader
  for the Color tokens page, `preview.tsx` (default theme, docs container), `preview-head.html`
  (first-frame theme and loading skeleton), `main.ts` (stories glob, backgrounds off), the three
  MDX pages with their page components and stylesheet, and `Stories.Docs` copy in the three
  story message files.
- Tests colocated in `.storybook/` for the theme/token sync, the token reader and the backdrop
  decorator.
- Seven `src/components/*/*.stories.tsx` files under `Cinema/` lose a `backgrounds` parameter
  that no longer does anything. No other change under `src/`, and no new dependency: `storybook/theming`, `storybook/manager-api` and the
  docs blocks all ship with the installed Storybook 10.
