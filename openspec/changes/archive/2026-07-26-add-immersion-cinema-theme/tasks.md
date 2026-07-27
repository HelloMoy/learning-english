# Tasks — add-immersion-cinema-theme

Presentation-only. No domain/port/storage changes. Order: tokens → primitives → header → per-view rewires → i18n → e2e/verification.

## 1. Token layer (foundation)

- [x] 1.1 Redefine `globals.css` semantic tokens to the Immersion Cinema palette for `.dark` (mockup values) — `--background`, `--foreground`, `--ink`, `--card`, `--muted-foreground`, `--signal-yellow`, `--practice-blue`, `--studio-paper`, `--border`, `--primary`, `--ring` — and add cinema tokens `--gold`, `--amber`, `--panel-2`, `--glow`, `--letterbox`. (TDD: n/a — visual; screenshot review light+dark)
- [x] 1.2 Design the accessible cinema-**light** (`:root`) ramp: warm ivory bg, cream/ink text, bronze accent for text-on-light, amber only for large fills/glows. (TDD: n/a — visual)
- [x] 1.3 Add a contrast guard test asserting accent/body token pairs resolve to AA-passing values in both themes, so a future edit can't silently regress D2. (TDD: test → tune tokens)
- [x] 1.4 Grep every consumer of remapped tokens (`practice-blue`, `signal-yellow`, `studio-paper`, `ink`) and screenshot-review error/empty states not otherwise touched. (TDD: n/a — review)

## 2. Shared cinema primitives

- [x] 2.1 `splitBilingualNotes(markdown) → { es, en }` pure helper: ES-block/EN-block split + single-column fallback + empty input. (TDD: test → impl)
- [x] 2.2 `PosterCard` (number, title, posterUrl|glow-only, size, badge, play affordance): renders `<img alt>` or glow fallback; play affordance is an accessible control. (TDD: test → impl)
- [x] 2.3 `CinemaBackground` (radial glow + letterbox), `Brand` wordmark, `SectionChrome`/eyebrow, `GoldBadge`, `PlayButton`: landmarks/labels, `focus-visible`, reduced-motion. (TDD: test → impl)
- [x] 2.4 Storybook stories for each primitive (folder-per-component convention). (TDD: story alongside impl)

## 3. Global header chrome

- [x] 3.1 Update `[locale]/layout.tsx` to render `Brand` + `IMMERSION CINEMA · <SECTION>` (section derived from route, server-side) and wrap content in `CinemaBackground`. (TDD: test → impl)
- [x] 3.2 Re-style `LocaleSwitcher` and `ThemeToggle` as chips without changing their behavior; assert locale switch + theme toggle still work. (TDD: test → impl)

## 4. Home view

- [x] 4.1 Rewire `[locale]/page.tsx` to the cinema hero ("Now streaming") + featured-course rail (Welcome poster, counts pill, `01–10` index, Open course / + My List). (TDD: test → impl)
- [x] 4.2 Tests: real title/description/counts, locale-aware links, empty-catalog state, localized copy. (TDD: test → impl)

## 5. Course overview

- [x] 5.1 Replace `CourseOverviewTrack` in `CourseOverview` with the 5×2 `PosterCard` grid ("Season 1 · N episodes") + "Start course" CTA. (TDD: test → impl)
- [x] 5.2 Remove `CourseOverviewTrack` from the composition; delete the component + stories/tests once grep confirms no other importer. (TDD: grep → delete)
- [x] 5.3 Tests: 10 posters `01–10` in order, each links to its module; Start course → first lesson; localized. (TDD: test → impl)

## 6. Module overview

- [x] 6.1 Rewire `ModuleOverview` to hero poster + episode rows ("Episode N · duration · Open"), back link to course. (TDD: test → impl)
- [x] 6.2 Tests: rows in `sequence` order, duration only for video lessons, locale-aware Open links + back link. (TDD: test → impl)

## 7. Lesson view

- [x] 7.1 Restyle `LessonView` to the cinema three-column layout: video hero w/ gold overlay (keep `NativeVideoPlayer`), restyle outline + right rail (Resources / Lesson notes / Up next). (TDD: test → impl)
- [x] 7.2 Add the Notes/Transcript tab pair; Notes renders ES/EN split via `splitBilingualNotes` through the safe `Markdown` component. (TDD: test → impl)
- [x] 7.3 Transcript tab present but `aria-disabled` with a localized "not available" state; no transcript data invented. (TDD: test → impl)
- [x] 7.4 Tests: hero overlay + native controls preserved, `aria-current` in outline, ES/EN columns, single-column fallback, disabled transcript, no raw-HTML injection, keyboard focus on Mark-as-complete. (TDD: test → impl)

## 8. Localization

- [x] 8.1 Add cinema microcopy keys to `src/messages/{en,es,pt}.json` (nowStreaming, limitedSeries, season, episode, feature, openCourse, myList, startCourse, español, english, transcriptUnavailable, upNext, resources, courseOutline, sectionHome/Course/Module/Lesson, …) and Storybook messages. (TDD: n/a — data; asserted by view tests)

## 9. Verification

- [x] 9.1 Playwright e2e: `/en` → course → module → lesson — header brand + section label, Start course reaches a lesson, video hero + Mark-as-complete keyboard-reachable with visible focus, Transcript disabled. (TDD: test → impl)
- [x] 9.2 Run `pnpm test:run` and `pnpm test:e2e` for the touched areas; screenshot-review all four views in light and dark against the mockups. (TDD: n/a — verification)
