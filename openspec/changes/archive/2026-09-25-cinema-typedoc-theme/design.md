## Context

`pnpm run docs` runs TypeDoc 0.28 over `src/` and writes a static site to the
gitignored `docs/`. Today it uses the stock `default` theme: a generic
light/dark palette, a toolbar titled `learning-english`, and — because
`typedoc.json` sets `readme: "none"` — an `index.html` that is the project's
module page, a flat list of 387 module paths.

The approved mock (https://claude.ai/artifact/JjycbuUj4srjtSo46TnZ8V) shows the
target: the Immersion Cinema dark palette from `src/app/globals.css` (`.dark`),
the `ENGLISH·COURSE` wordmark, the radial amber glow, gold eyebrows and pills,
a home page built from a marquee, hexagon-layer posters and a grouped
module index, and declaration pages with a kind eyebrow and a gold-framed
signature.

TypeDoc supports this through plugins: a plugin's `load(app)` can call
`app.renderer.defineTheme(name, ThemeClass)`, where the theme subclasses
`DefaultTheme` and returns a `DefaultThemeRenderContext` subclass whose
partials (`toolbar`, `header`, `footer`, `reflectionTemplate`, …) are
overridable fields. `customCss` copies a stylesheet to `assets/custom.css`,
loaded after TypeDoc's own `style.css`.

Constraint: the machine runs Node 22.17, which cannot `import()` a TypeScript
plugin without flags. `tsx` is already a dev dependency and every other
TypeScript script in `scripts/` runs through it.

## Goals / Non-Goals

**Goals:**
- The generated reference matches the mock in the dark theme, on every page.
- The home page is generated from the project model, so its counts and index
  stay true as modules are added.
- TypeDoc's search, navigation tree, page menu and copy buttons keep working.
- Plugin logic is TypeScript, clean-code compliant and unit tested.

**Non-Goals:**
- A light variant, translations, hosting, or changing what gets documented
  (see proposal).

## Decisions

### D1. A local TypeDoc plugin under `scripts/typedoc-cinema-theme/`

The theme lives beside the other build-time tooling in `scripts/`, outside
`src/`, so TypeDoc's `entryPoints: ["./src"]` never documents it and the app
bundle never sees it. `typedoc.json` gains
`"plugin": ["./scripts/typedoc-cinema-theme/typedoc-cinema-theme.mts"]` and
`"theme": "cinema"`.

Files, one responsibility each:

| File | Responsibility |
| --- | --- |
| `typedoc-cinema-theme.mts` | `load(app)`: registers the `cinema` theme |
| `cinema-theme.mts` | `CinemaTheme` + `CinemaThemeContext` (partial overrides) |
| `module-index.mts` | pure helpers: module display names, folder grouping, layer counts |
| `cinema-home.mts` | renders the home page (marquee, layer posters, module index) |
| `cinema-chrome.mts` | renders the wordmark toolbar, declaration header, footer |
| `cinema.css` | palette and component styling, passed as `customCss` |

*Alternative considered:* `customCss` alone. Rejected: CSS cannot build the
home page, split "Function formatDuration" into an eyebrow and a name, or
colour only the wordmark's dot.

*Alternative considered:* a published theme package (e.g.
`typedoc-material-theme`). Rejected: none carries the cinema identity, and a
dependency for one stylesheet is not worth it.

### D2. Templates are `.mts` files calling `JSX.createElement`, not `.tsx`

TypeDoc ships its own JSX runtime (`JSX.createElement`, `JSX.Fragment`,
`JSX.Raw`). The repo's `tsconfig.json` compiles `.tsx` with
`jsx: "react-jsx"` and Vitest transforms `.tsx` through the React plugin, so a
`.tsx` template would need per-file pragmas that both TypeScript and the
Vitest transform must honour. Plain TypeScript files calling a local
`const h = JSX.createElement` avoid that entirely and keep the tooling
untouched.

The plugin's files use the `.mts` extension and import each other with it.
The repo's `package.json` has no `"type": "module"`, so `tsx` would run a
`.ts` plugin as CommonJS and its `require("typedoc")` would load a second
copy of TypeDoc next to the ESM one the CLI started. TypeDoc then warns
"TypeDoc has been loaded multiple times" and fails rendering, because its
`instanceof` checks see two different class hierarchies. `.mts` keeps the
plugin on the ESM loader, sharing the CLI's instance.

### D3. `pnpm run docs` runs TypeDoc through `tsx`

`"docs": "tsx node_modules/typedoc/bin/typedoc"` and the same with `--watch`
for `docs:watch`. `tsx` registers its loader before TypeDoc starts, so
TypeDoc's `import()` of the `.mts` plugin resolves.
The script is invoked as `pnpm run docs`: pnpm 11 reserves `pnpm docs` for
its own "open a package's docs" command. *Alternative:* compile the
plugin to `.js` first — an extra build step and a checked-in or generated
artefact for no gain. *Alternative:* `node --experimental-strip-types` —
does not resolve extensionless relative imports and still warns on 22.17.

### D3b. A reader never sees an old build

`cacheBust: true` makes TypeDoc append `?cache=<build time>` to every asset
URL, so a new build's pages point at new stylesheet URLs. That only helps if
the browser fetches the new page: `http-server`, which `pnpm docs:serve` runs,
sends `cache-control: max-age=3600` by default, so a browser kept serving the
previous build's HTML — and with it the previous stylesheet URL — for an hour.
`docs:serve` passes `-c-1` to turn that caching off. Both are needed: the flag
fixes local review, and cache busting keeps any other static host honest.

### D4. Dark only, whatever TypeDoc's stored preference says

TypeDoc writes `data-theme` (`os` | `light` | `dark`) from `localStorage`
before first paint and defines its palette under all three. `cinema.css`
redefines TypeDoc's `--color-*` custom properties under
`:root, :root[data-theme]` (loaded after `style.css`, so it wins at equal
specificity), sets `color-scheme: dark`, and hides `.tsd-theme-toggle`.
Both `lightHighlightTheme` and `darkHighlightTheme` point at the same warm
Shiki theme, so code never flips to a light palette. The Shiki theme is
picked from TypeDoc's bundled set by visual check against the mock
(first candidate: `gruvbox-dark-medium`).

This mirrors the app, whose spec (`cinema-theme-tokens`) makes dark the
default and refuses to let the OS choose.

### D5. The home page replaces the project page's template

With `readme: "none"`, TypeDoc renders `index.html` from the project
reflection through `reflectionTemplate`. `CinemaThemeContext` keeps a
reference to the default `reflectionTemplate` and delegates to it for every
model except the project, which gets `cinemaHome`. The default `header` is
skipped on that page so the marquee is the only title.

The home page reads only the project model:

- **Layer posters** — a fixed list of six hexagon layers (`domain/use-cases`,
  `domain/ports`, `domain/entities`, `adapters`, `hooks`, `components`), each
  with a title and one-line blurb. The count is the number of modules whose
  path starts with that folder, computed at render time.
- **Module index** — modules grouped by folder: the first path segment, or
  the first two under `domain/`. Groups that match a layer come first in
  layer order, the rest alphabetically. A row shows the module path with the
  repeated leaf collapsed (`lib/format-duration/format-duration` →
  `lib/format-duration`), the short summary of its representative export
  (the first documented function or class, then variable or enum, then any
  other documented export — so a hook module is summarised by its hook, not
  by the props type it declares first), and the distinct kinds it exports. Posters link to their group's anchor.
- **Marquee** — project name, `project.packageVersion` (enabled with
  `includeVersion: true`) and the module count as badges.

Row summaries come from TypeDoc's own `commentShortSummary`, which returns
nothing unless `useFirstParagraphOfCommentAsSummary` is on (or a comment has
an explicit `@summary`). The option is enabled in `typedoc.json`; as a side
effect module pages list a one-line summary under each member too, which is
what TypeDoc intends the option for.

Grouping, collapsing and counting are pure functions in `module-index.ts`
working on module names, so they are tested without TypeDoc.

### D6. Chrome keeps TypeDoc's control IDs

The toolbar override copies TypeDoc's toolbar markup and changes only the
title link's content (wordmark + `API` tag). The search trigger, the search
`<dialog>` and the menu trigger keep their IDs and ARIA attributes, because
TypeDoc's `main.js` binds to them. The declaration header keeps
`context.breadcrumbs` and `context.reflectionFlags`, and renders the kind
(`ReflectionKind.singularString`) as an eyebrow above the name.

### D7. Palette copied, not imported

`cinema.css` copies the `.dark` values from `src/app/globals.css`. Importing
`globals.css` would drag Tailwind, shadcn and the app's base layer into
TypeDoc's pages. A comment in `cinema.css` points at the source of the values.

### D8. One gradient per page

The page's fixed amber glow (the app's `CinemaBackground`) is the only
gradient. Cards — layer posters, the signature panel, the module index — use
the flat `--card` surface with a border, and the home marquee has no card at
all: it sits on the page ground. A card with its own radial glow on top of the
page glow read as two light sources fighting. The glow lives on a fixed
`body::before` at `z-index: -1`, so `body` itself stays transparent and only
`html` paints the solid ground; a painted `body` would cover the glow.

## Testing strategy

| Behaviour | Layer | Where |
| --- | --- | --- |
| Display-name collapsing, folder grouping and ordering, layer counts | Vitest unit | `scripts/typedoc-cinema-theme/module-index.test.ts` |
| Home page: marquee badges, one poster per layer with its count and anchor, grouped rows with summary and kinds | Vitest unit, rendered with `JSX.renderElement` against a hand-built `ProjectReflection` and a stub context | `cinema-home.test.ts` |
| The plugin registers a `cinema` theme that renders a small fixture project: `index.html` is the cinema home, declaration pages keep TypeDoc's templates, `custom.css` is emitted; the toolbar shows the wordmark and keeps the search/menu IDs; the declaration header shows the kind eyebrow and a name-only `h1`; the footer shows the regenerate command | Vitest integration, `Application.bootstrap` over a fixture under `scripts/typedoc-cinema-theme/fixture/`, output to a temp dir, pages loaded into jsdom and queried with Testing Library | `typedoc-cinema-theme.test.ts` |
| Visual match with the mock (palette, glow, posters, signature, mobile width) | Manual, Playwright MCP against `pnpm docs:serve` | — |

The chrome is checked on rendered pages rather than with a stub context:
the toolbar and header call into TypeDoc's own context (`icons`, `options`,
`breadcrumbs`, `reflectionFlags`), and a stub of those would test the stub. No Playwright spec: `e2e/` covers app
flows, and the reference is not part of the app.

## Risks / Trade-offs

- [TypeDoc changes partial signatures or CSS variable names in a minor
  release] → `typedoc` is pinned to `^0.28`; the integration test renders a
  real project with the theme and fails if the templates break.
- [The copied palette drifts from `globals.css`] → the stylesheet names its
  source; the values are the spec'd dark tokens, which rarely change.
- [Grouping 387 modules on one page makes it long] → the stock page already
  lists all of them; groups add anchors and posters jump to them.
- [`tsx` becomes required to build docs] → it is already a dev dependency
  used by nine scripts.

## Migration Plan

None. Regenerate with `pnpm run docs`. Rolling back is reverting `typedoc.json`
and the two `package.json` scripts.

## Open Questions

None.
