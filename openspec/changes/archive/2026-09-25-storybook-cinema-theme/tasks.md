## 1. Token reader

- [x] 1.1 In `.storybook/cinema-tokens.test.ts`, assert that `readCinemaTokens(css, "dark")` returns the custom properties declared in a `.dark { … }` fixture in source order, and `"light"` those of `:root { … }`; confirm it fails because the module does not exist (TDD: test → impl)
- [x] 1.2 Add cases for what it must ignore: properties inside `@theme inline`, declarations in other selectors, and comments inside the block (TDD: test → impl)
- [x] 1.3 Implement `.storybook/cinema-tokens.ts` with JSDoc; confirm the tests pass (TDD: test → impl)

## 2. Manager theme

- [x] 2.1 In `.storybook/cinema-theme.test.ts`, read `src/app/globals.css` from disk and assert that every entry of `CINEMA_THEME_TOKENS` has `cinemaTheme[key]` equal to the `.dark` token it names; assert the base is dark, the fonts are Geist / Geist Mono, and `brandTitle` reads `ENGLISH·COURSE` with the dot in gold; confirm it fails (TDD: test → impl)
- [x] 2.2 Implement `.storybook/cinema-theme.ts` (`create({ base: "dark", … })` plus the typed `CINEMA_THEME_TOKENS` map); confirm the tests pass (TDD: test → impl)
- [x] 2.3 Register the theme in `.storybook/manager.ts` with `addons.setConfig({ theme: cinemaTheme })` and load Geist / Geist Mono in `.storybook/manager-head.html`
- [x] 2.4 In `.storybook/cinema-theme.test.ts`, assert the brand carries a gold, uppercase `Design system` tag beside the wordmark, like the API reference's `API` tag; confirm it fails, then add it (TDD: test → impl)

## 3. Canvas

- [x] 3.1 In `.storybook/cinema-backdrop.test.tsx`, assert that `withCinemaBackdrop` renders the story plus the `aria-hidden` cinema backdrop when `viewMode` is `"story"`, and only the story when it is `"docs"`; confirm it fails (TDD: test → impl)
- [x] 3.2 Implement `.storybook/cinema-backdrop.tsx` reusing `CinemaBackground`; confirm the tests pass (TDD: test → impl)
- [x] 3.3 In a new `.storybook/preview.test.ts`, assert that the canvas theme defaults to `dark`, that `parameters.docs.theme` is `cinemaTheme`, that `withCinemaBackdrop` is among the decorators, and that the stale `backgrounds` parameter is gone; confirm it fails (TDD: test → impl)
- [x] 3.4 Update `.storybook/preview.tsx` accordingly (export the theme switcher options so the default is testable); confirm the tests pass (TDD: test → impl)
- [x] 3.5 Extend `.storybook/main.test.ts`: `features.backgrounds` is `false` and `stories` includes the `./docs/*.mdx` glob; confirm it fails, then update `.storybook/main.ts` (TDD: test → impl)
- [x] 3.6 Remove the now-inert `parameters.backgrounds` from the seven `Cinema/` stories
- [x] 3.7 In `.storybook/preview.test.ts`, run the inline script of `preview-head.html` and assert `<html>` gets the default theme's class before render; confirm it fails, then add the script (TDD: test → impl)
- [x] 3.8 In `.storybook/preview.test.ts`, assert that `preview-head.html` paints Storybook's loading skeleton on `--background` and uses only `.dark` token colours; confirm it fails, then add the overrides (TDD: test → impl)

## 4. Docs pages

- [x] 4.1 Add `.storybook/docs/docs.css` with the layout rules the pages share
- [x] 4.2 Add `.storybook/docs/Welcome.mdx` (`Docs/Welcome`): hero, the four sidebar groups as `PosterCard`s, and the four things a component needs before it ships
- [x] 4.3 Add `.storybook/docs/ColorTokens.mdx` (`Docs/Color tokens`) rendering both palettes with `ColorPalette` / `ColorItem` from `readCinemaTokens(globals.css?raw, …)`
- [x] 4.4 Add `.storybook/docs/Typography.mdx` (`Docs/Typography`) with `Typeset` for Geist and Geist Mono
- [x] 4.5 In `.storybook/cinema-docs-container.test.tsx`, assert `CinemaDocsContainer` renders the docs page and the cinema backdrop inside one `.dark` scope, and in `preview.test.ts` that it is `parameters.docs.container`; confirm both fail, then add the container and clear the docs wrapper's fill (TDD: test → impl)

## 6. Docs follow the toolbar

- [x] 6.1 In `.storybook/cinema-theme.test.ts`, assert `cinemaLightTheme` is a light theme whose mapped colours equal the `:root` tokens, as `cinemaTheme` does for `.dark`; confirm it fails, then build both themes from one palette-per-variant function (TDD: test → impl)
- [x] 6.2 In `.storybook/messages/messages.test.ts`, assert the story catalogues share one key set across en, es and pt; confirm it passes today, then keep it green while adding `Stories.Docs` (TDD: guard)
- [x] 6.3 In `.storybook/cinema-docs-container.test.tsx`, assert the container scopes the page in `.dark` and passes `cinemaTheme` for `theme: "dark"`, drops the scope and passes `cinemaLightTheme` for `"light"`, provides the locale's messages, falls back to the toolbar defaults, and re-renders on `globalsUpdated`; confirm it fails, then implement (TDD: test → impl)
- [x] 6.4 In `.storybook/docs/welcome-page/welcome-page.test.tsx`, assert the headline reads "The design system for English Course." in en with "design system" marked, and its translation in es and pt, and that the four group prefixes appear in every locale; confirm it fails, then add `WelcomePage`, its messages, and reduce `Welcome.mdx` to `<Meta>` + the component (TDD: test → impl)
- [x] 6.5 Same for `ColorTokensPage` (translated copy and variant labels, swatches still from `globals.css`) and `TypographyPage` (translated copy, samples unchanged) (TDD: test → impl)
- [x] 6.6 Check with Playwright MCP that on each of the three pages the Theme button moves the page between dark and light and the locale menu switches its copy between English, Español and Português

## 5. Verification

- [x] 5.1 Run `pnpm storybook` in the worktree and check with Playwright MCP: the manager is cinema-dark with the wordmark, Storybook opens on `Docs/Welcome`, a Cinema story opens dark on the backdrop and switches to light, a component docs page has no stacked backdrops, and the Color tokens and Typography pages render
- [x] 5.2 Run `pnpm build-storybook` and confirm it builds
- [x] 5.3 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`)
