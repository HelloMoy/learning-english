## Why

The API reference that `pnpm run docs` generates uses TypeDoc's stock theme, so it
looks like no other part of English Course. Readers who move between the app,
Storybook and the reference lose the product's visual identity, and the
stock landing page is a flat list of 387 module paths with no way in by
architectural layer. The approved mock
(https://claude.ai/artifact/JjycbuUj4srjtSo46TnZ8V) restyles the reference in
the app's Immersion Cinema dark theme and gives it a home page that starts
from the hexagon.

## What Changes

- A TypeDoc theme named `cinema`, loaded as a local plugin, that renders the
  reference in the Immersion Cinema **dark** palette whatever the reader's OS
  or stored TypeDoc preference is. TypeDoc's Light/Dark/OS selector is hidden.
- A toolbar carrying the `ENGLISH·COURSE` wordmark (gold middle dot) and an
  `API` tag, keeping TypeDoc's search and menu controls working.
- A home page (`index.html`) made of a marquee (eyebrow, headline, lede,
  version and module-count badges) set straight on the page's glow, not in a
  card, one poster per hexagonal layer with
  its live module count, and an index of every module grouped by folder, each
  row showing a one-line summary and the kinds of symbol it exports.
- Declaration pages (functions, types, interfaces, variables, components)
  with the kind as a gold eyebrow above a monospace name, a gold-framed
  signature, cinema section headings, parameter lists and code blocks.
- A footer with the wordmark and the regenerate command.
- `pnpm run docs` / `pnpm docs:watch` run TypeDoc through `tsx` so the plugin can
  be written in TypeScript (Node 22.17 cannot load `.ts` plugins on its own).

## Capabilities

### New Capabilities
- `api-reference-theme`: how the generated TypeDoc reference looks and what
  its home page shows — cinema dark palette, branded toolbar and footer,
  layer posters, grouped module index, styled declaration pages.

### Modified Capabilities
<!-- None: the app's own theme tokens (cinema-theme-tokens) are read, not changed. -->

## Impact

- New: `scripts/typedoc-cinema-theme/` (plugin, pure helpers, stylesheet,
  colocated Vitest tests).
- Changed: `typedoc.json` (`plugin`, `theme`, `customCss`, highlight theme,
  `includeVersion`, `useFirstParagraphOfCommentAsSummary`, `favicon`,
  `cacheBust`), `package.json` scripts `docs`, `docs:watch` and `docs:serve`
  (served with caching off).
- Only the generated `docs/` output changes; it stays gitignored. No app
  code under `src/` changes and nothing ships to users of the app.
- No new dependencies: `typedoc` and `tsx` are already installed.

## Non-goals

- A light variant of the reference. The mock and this change are dark only.
- Translating the reference. TypeDoc output stays English, as AGENTS.md says.
- Changing which symbols get documented (`excludeNotDocumented`, entry
  points) or fixing the existing TypeDoc link warnings.
- Publishing or hosting the reference anywhere.
- The mock's "Used by" line on declaration pages; TypeDoc does not know
  reverse references.
- Sharing tokens with `src/app/globals.css` at build time. The stylesheet
  copies the dark values; keeping them in sync is manual.
