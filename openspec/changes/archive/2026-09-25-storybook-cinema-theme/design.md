## Context

Storybook 10.4 (`@storybook/nextjs-vite`) runs two separate bundles:

- the **manager** (sidebar, toolbar, addon panel), built by Storybook's own esbuild step from
  `.storybook/manager.ts`. Its only styling hook is a theme object made with `create()` from
  `storybook/theming/create` and registered with `addons.setConfig({ theme })`. It cannot see
  `globals.css`; nothing Tailwind or CSS-variable based reaches it.
- the **preview** iframe, built by Vite from `.storybook/preview.tsx`. It already imports
  `src/app/globals.css`, and `withThemeByClassName` toggles the `.dark` class on `<html>`, which is
  what switches the Immersion Cinema tokens. Its default today is `light`.

Docs pages (MDX, and the autodocs of each component) render inside the preview iframe but take
their chrome colours from `parameters.docs.theme`, a theme object of the same shape as the
manager's.

The app itself paints every page on `CinemaBackground` (`src/components/cinema-background`), a
fixed `-z-10` layer with a warm glow and a letterbox scrim. `body` already gets `bg-background`
from `globals.css`. The canvas in Storybook shows only that flat colour, and the backgrounds
feature offers `#ffffff` and `#0a0a0a` swatches that paint over it.

Seven `Cinema/` stories set `parameters.backgrounds.default = "dark"` to get a dark canvas.

## Goals / Non-Goals

**Goals:**

- Cinema-dark for the manager, and a cinema-dark / cinema-light pair for docs pages.
- Each theme provably matches its token block in `globals.css`, so a token change cannot leave
  Storybook behind unnoticed.
- The canvas matches the app: dark by default, cinema backdrop behind the story, light still one
  toolbar click away.
- A `Docs/` group that opens Storybook on a Welcome page and documents colours and type from the
  real sources, and whose pages obey the toolbar's theme and locale like a story.

**Non-Goals:** see the proposal. In short: no app component changes, no light manager, no
translated sidebar entries, no live counts.

## Decisions

### D1. The themes hard-code hex values, guarded by a sync test

`.storybook/cinema-theme.ts` exports `cinemaTheme` (dark, for the manager and dark docs) and
`cinemaLightTheme` (light docs). Both are built by one function from a literal palette per
variant, keyed by token name, so the mapping below is written once. Colours taken from the
variant's block: `appBg`/`barBg` = `--sidebar`, `appContentBg`/`appPreviewBg` =
`--background`, `appBorderColor`/`inputBorder` = `--border`, `colorPrimary`/`barSelectedColor` =
`--gold`, `colorSecondary` = `--bronze`, `barHoverColor` = `--amber`, `inputBg` = `--card`,
`textColor` = `--foreground`, `textInverseColor` = `--card` (the surface of opposite lightness),
`textMutedColor`/`barTextColor` = `--muted-foreground`, radii from `--radius` (10px), fonts Geist /
Geist Mono.

`colorSecondary` is bronze, not gold, because Storybook fills the selected sidebar item with it
darkened by 18% under white text. Gold there leaves the label near 3:1; bronze clears AA. This
was found in the browser check and differs from the mock, which showed gold text on a gold tint.

The mapping lives next to the themes as a `CINEMA_THEME_TOKENS` table
(`themeKey → token name`), and `cinema-theme.test.ts` reads `src/app/globals.css` from disk and
asserts, for each theme, that every mapped key equals its token in that theme's block.

- _Alternative: import `globals.css?raw` and derive the theme at runtime._ Rejected: the manager
  is bundled by esbuild, not Vite, so `?raw` is not available there, and parsing CSS in the
  manager at startup would be work done on every load to avoid a test.
- _Alternative: read `getComputedStyle` in the manager._ Rejected: the tokens are defined in the
  preview iframe's stylesheet, not the manager document.

### D2. One pure token reader, used by the sync test and the Color tokens page

`.storybook/cinema-tokens.ts` exports `readCinemaTokens(css, variant)`, returning the custom
properties declared directly in the `:root` (light) or `.dark` block as an ordered
`[name, value][]`. It is a pure string function so both callers can share it: the sync test feeds
it the file from disk, and the Color tokens page feeds it `globals.css?raw` (Vite, preview side).
The page therefore never shows a value that differs from the app.

### D3. Dark by default in the canvas; the backgrounds feature is turned off

`withThemeByClassName` keeps both themes and changes `defaultTheme` to `"dark"`, matching the
`cinema-theme-tokens` requirement that dark is the app's default. The decorator only applies the
class once a story mounts, so `preview-head.html` adds `dark` to `<html>` first. Without it the
preview paints the light tokens while it loads, and for the whole of an MDX page with no story.
The decorator still removes the class when the toolbar picks light.

Storybook's own loading skeleton (`.sb-preparing-story`, `.sb-preparing-docs`) is hard-coded
white and paints before `globals.css` loads, so `preview-head.html` overrides it with literal
cinema-dark values. A test fails if any colour there stops being a `.dark` token. `main.ts` sets
`features: { backgrounds: false }`: the theme switch already decides the canvas colour, and a
background swatch can only contradict it. The seven `backgrounds: { default: "dark" }`
parameters become inert and are removed.

### D4. The canvas renders `CinemaBackground` through a decorator, in story view only

`.storybook/cinema-backdrop.tsx` exports `withCinemaBackdrop`, which renders the app's own
`<CinemaBackground />` beside the story when `context.viewMode === "story"`. Reusing the
component, rather than copying its gradients into a stylesheet, means the canvas changes when the
app's backdrop changes. It reads `var(--glow)`/`var(--background)`, so it follows the light/dark
switch with no extra code.

In docs view the decorator adds nothing: each story there is an inline block, and a `fixed`
full-viewport layer per block would stack behind the whole docs page.

- _Alternative: a `body` background in a preview stylesheet._ Rejected: it would be a second copy
  of the backdrop, and it would also land under docs pages.

### D5. Docs pages live in `.storybook/docs/`, not `src/`

`Welcome.mdx`, `ColorTokens.mdx` and `Typography.mdx` document the workshop, not the product, the
same way `.storybook/messages/` holds story-only copy. `main.ts` adds `"./docs/*.mdx"` to
`stories`; `<Meta title="Docs/…" />` puts them in the `Docs` group that `storySort` already
orders first, and `Docs/Welcome` sorts first inside it, so it is the landing page.

`parameters.docs.container` is `CinemaDocsContainer`, which wraps Storybook's `DocsContainer`
together with the app's `CinemaBackground`, and `docs.css` clears the docs wrapper's opaque fill
so that backdrop shows through. Every docs page therefore sits on the same glow and letterbox
scrim as a story in the canvas. How the container follows the toolbar is D7.

The wrapper sets `color: var(--foreground)`, which blocks such as `Typeset` need: they take their
text colour from their parent rather than from the docs theme.

- _Alternative: a glow drawn by each page's own wrapper._ Tried first on Welcome. It left the
  other pages flat and duplicated the backdrop; the container gives every page the real one.

This project has no autodocs pages, so the three `Docs/` pages are the only docs view today; the
docs-view branch of the backdrop decorator is covered by its unit test. Presentation uses Storybook's own doc blocks where they fit
(`ColorPalette`/`ColorItem`, `Typeset`) and the app's `Eyebrow`, `PosterCard` and `GoldBadge` on
the Welcome page. The few layout rules the pages need sit in `.storybook/docs/docs.css`, since
Tailwind's content scan is not configured to read `.storybook/`.

`PosterCard` is used without `href`: a docs page links nowhere in the app.

### D7. Docs pages follow the toolbar through their container

Decorators such as `withThemeByClassName` and `withNextIntl` never run on an MDX page with no
story, so the container takes over their job for docs. It reads the `theme` and `locale` globals
from the docs context's story store, falling back to the toolbar defaults, and re-renders on the
channel's `globalsUpdated` event. With them it:

- scopes the page in `.dark` or leaves it on the light tokens, and passes `cinemaTheme` or
  `cinemaLightTheme` to `DocsContainer`, so backdrop, text and blocks switch together;
- mounts `NextIntlClientProvider` with the same merged messages the story decorator uses.

The store is not part of Storybook's typed `DocsContextProps`. It is read through one small,
defensive accessor with a fallback, so an internal rename degrades to the default theme and
locale rather than breaking the page.

The copy moves out of MDX into three page components in `.storybook/docs/` (`WelcomePage`,
`ColorTokensPage`, `TypographyPage`) that call `useTranslations("Stories.Docs.…")`. Each MDX file
is left with its `<Meta>` and one component. The strings live in `.storybook/messages/<locale>.json`
beside the rest of the story-only copy, so they never reach the app bundle. Page headings are
styled by `docs.css` rather than by Storybook's markdown styles, because they are no longer
markdown.

- _Alternative: keep MDX prose and hide the controls on docs pages._ Offered and declined: the
  reviewer expects the toolbar to work on every page it appears on.

The Welcome headline mirrors the TypeDoc home ("The API reference for English Course."): "The
design system for English Course.", with "design system" in gold, under a "Now showing" eyebrow
and above a row of chips, so the two tools read as siblings.

### D6. The brand is the wordmark in HTML, fonts come from `manager-head.html`

`brandTitle` accepts markup, so it carries `ENGLISH·COURSE` with the dot in `--gold`, letter-spaced
like `Brand`, followed by a gold `Design system` tag drawn like the `API` tag the TypeDoc reference
hangs beside the same wordmark, so the two tools read as parts of one product. The pair wraps, and
at Storybook's default sidebar width the tag sits under the wordmark. The manager does not load the preview's `preview-head.html`, so a
`manager-head.html` loads Geist and Geist Mono from Google Fonts the same way.

## Testing strategy

| Behaviour | Layer | File (pattern mirrored) |
| --- | --- | --- |
| `readCinemaTokens` reads `:root` and `.dark`, ignores nested/other blocks | Vitest unit | `.storybook/cinema-tokens.test.ts` (like `stub-server-actions.test.ts`) |
| Every mapped manager-theme colour equals its `.dark` token in `globals.css`; brand shows the wordmark | Vitest unit | `.storybook/cinema-theme.test.ts` |
| `features.backgrounds` is off and the docs glob is in `stories` | Vitest unit | extends `.storybook/main.test.ts` |
| `CinemaDocsContainer` follows the `theme` and `locale` globals and re-renders on `globalsUpdated` | Vitest + RTL | `.storybook/cinema-docs-container.test.tsx` |
| Each docs page renders its copy in en, es and pt; every `Stories.Docs` key exists in all three | Vitest + RTL | `.storybook/docs/<page>/<page>.test.tsx`, `.storybook/messages/messages.test.ts` |
| Canvas defaults to dark, and `preview-head.html` marks `<html>` with that class before render; docs use `cinemaTheme`; the backdrop decorator is installed | Vitest unit | new `.storybook/preview.test.ts` |
| `withCinemaBackdrop` renders the backdrop in story view and nothing extra in docs view | Vitest + RTL | `.storybook/cinema-backdrop.test.tsx` (like `nuqs.test.tsx`) |
| Manager, canvas (dark and light) and the three docs pages look like the mock | Manual, Playwright MCP against `pnpm storybook` | screenshots, no committed spec |

No Playwright `e2e/` spec: Storybook is not part of the app's browser flows.

## Risks / Trade-offs

- [Storybook changes a theme key name in a minor release] → the sync test type-checks the
  mapping against `ThemeVars`, so a renamed key fails `pnpm typecheck`.
- [`brandTitle` markup stops being rendered as HTML] → the brand would show the tags as text; the
  Playwright check covers it, and the fallback is plain `ENGLISH·COURSE`.
- [A story that needs a plain canvas now gets the glow] → the backdrop is the page every
  component actually sits on in the app, so this is the intended review surface. A story can
  still wrap itself in its own background.
- [Storybook renames the docs context's store] → the accessor falls back to the toolbar defaults
  and the page still renders; the container test pins the path it reads.
- [Docs in light sit inside a dark manager] → deliberate: the manager is chrome, the page is the
  thing under review, like the canvas.
