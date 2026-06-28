# Storybook

Architecture and configuration notes for the Storybook setup in this project.

> This document explains **why** the configuration is the way it is and how to evolve it.
> For **rules** the AI agent follows when writing stories or components, see `AGENTS.md`.

## Stack

- **Framework**: `@storybook/nextjs-vite` — Vite-based, recommended over `@storybook/nextjs` (webpack) for all Next.js projects per the official Storybook docs.
- **Addons**: `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-themes`, `@storybook/addon-vitest` (the last one is installed but not wired up — see [addon-vitest status](#addons-installed-but-not-wired-up) below).

## File layout

```
.storybook/
├── main.ts              # framework + addons + stories glob + @/ alias
├── preview.tsx          # decorators: next-intl provider + theme switcher
├── preview-head.html    # font preloads from Google Fonts CDN
└── messages/            # story-only translations (see below)
    ├── en.json
    ├── es.json
    └── pt.json

src/**/*.stories.{ts,tsx}   # stories colocated with components
```

## Story translations

Translations used by stories live in **`.storybook/messages/<locale>.json`** under the `Stories.*` namespace, **not** in `src/messages/<locale>.json`.

**Why separate?**

- `src/messages/*` is shipped to production. Story demo copy ("Click me", "Delete") never reaches end users — bundling it inflates the JS bundle with strings no one sees.
- Translators can ignore the `Stories.*` namespace entirely.
- Removing a component is a single delete (story + messages key + JSDoc), not a hunt across multiple files.

The `preview.tsx` loads story messages separately from app messages, so production builds are unaffected.

## Fonts

`next/font/google` injects font `@font-face` rules via the Next.js build pipeline. Storybook doesn't run that pipeline, so the dev server falls back to system fonts unless we load them explicitly.

`preview-head.html` loads Geist + Geist Mono from the Google Fonts CDN and defines the CSS variables the app's `globals.css` references (`--font-geist-sans`, `--font-geist-mono`). Without this, `font-sans` / `font-mono` resolve to undefined and components render in the system fallback.

## Dark mode (shadcn integration)

shadcn/ui defines theme colors via CSS variables in `:root` and `.dark` blocks. To activate dark mode, the `.dark` class must be present on an ancestor of the rendered tree.

`@storybook/addon-themes` provides `withThemeByClassName`, which toggles `.dark` on a wrapper element. The preview wires it up so the toolbar exposes a light/dark switch automatically:

```ts
// .storybook/preview.tsx
decorators: [
  withThemeByClassName({ themes: { light: "", dark: "dark" }, defaultTheme: "light" }),
  withNextIntl,
];
```

The `globals.css` `@custom-variant dark (&:is(.dark *))` makes Tailwind's `dark:` variants work via any ancestor with the class — Storybook's wrapper satisfies that.

## Locale switching (next-intl)

The `globalTypes.locale` toolbar entry exposes a globe-icon dropdown. Items are derived from `routing.locales` (single source of truth — adding a new locale to `src/i18n/routing.ts` automatically extends the toolbar).

Decorator resolution order:

1. `parameters.locale` — explicit per-story override (rare; for stories that lock to a locale)
2. `globals.locale` — toolbar selection
3. `routing.defaultLocale` — fallback

If you add a new locale to `routing.locales`, also:

1. Add a label to `LOCALE_LABELS` in `.storybook/preview.tsx` — TypeScript will fail compilation if you forget (exhaustive `Record` check).
2. Create `.storybook/messages/<locale>.json` mirroring the `Stories.*` namespace.

## Translations vs Faker in stories

- **Translations** (default for any string the reviewer reads): deterministic, in `.storybook/messages/*` under `Stories.*`.
- **Faker** (exception for generated data when determinism doesn't matter): must be internationalized via `context.globals.locale` — pick `fakerES`, `fakerPT_BR`, etc., **never** default to the English `faker` instance when the toolbar shows `es` or `pt`.

See `AGENTS.md § Translations vs Faker in stories` for the full rule and the canonical code pattern.

## Addons installed but not wired up

### `@storybook/addon-vitest`

**Status**: package is in `devDependencies` and listed in `addons` (adds a panel to the dev server), but `pnpm test-storybook` is a no-op stub.

**Why disabled**: the project already has a working test stack (`Vitest + Testing Library + jsdom`) governed by `testing-conventions`. Activating the addon would run each story as a browser-based test in addition — slower, requires Playwright browsers, and partially duplicates the unit/component coverage.

**What activating it gives you**:

- Each story becomes a runnable test (Chromium headless via Playwright)
- a11y violations fail the build automatically (no need to flip `a11y.test` to `"error"` per story)
- Visual regression detection (paired with Chromatic)
- One source of truth: `Story` = test = documentation

**How to activate it later** (when there's a concrete need, e.g. CI catches a visual regression):

1. Add a `storybook` project to `vitest.config.ts`:

   ```ts
   import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

   export default defineConfig({
     test: {
       projects: [
         // …existing unit/component project…
         {
           extends: true,
           plugins: [storybookTest({ configDir: ".storybook" })],
           test: {
             name: "storybook",
             browser: {
               enabled: true,
               provider: "playwright",
               headless: true,
               instances: [{ browser: "chromium" }],
             },
             setupFiles: ["./.storybook/vitest.setup.ts"],
           },
         },
       ],
     },
   });
   ```

2. Create `./.storybook/vitest.setup.ts` for MSW / browser polyfills.

3. Install the Playwright browser: `pnpm exec playwright install chromium`.

4. Replace the `test-storybook` stub in `package.json`:

   ```json
   "test-storybook": "vitest --project storybook"
   ```

5. Add `pnpm test-storybook` to `pnpm verify` if you want it in the default check suite.
