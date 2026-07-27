## Context

The four public views already render real data through the hexagonal domain. This change is a **presentation-only re-skin** to the "Immersion Cinema" direction defined by `04-immersion-cinema-{home,course,module,lesson}.png`. No domain, port, use-case, or storage change is in scope.

Design tokens are taken verbatim from the mockup source (`_proposals/html/04-immersion-cinema-home.html`):

```
bg #08080b · panel #121319 / #191a22 · ink #f4f1ea · muted #9b968c
line #26262f · gold #e7b64c · amber #f0c869 · crimson #b3402f
```

The stack is Tailwind v4 (CSS-first `@theme inline` in `globals.css`, no JS config), shadcn (radix-nova), next-intl (en/es/pt), next-themes. Components consume **semantic** utilities (`bg-background`, `text-ink`, `bg-signal-yellow`, `bg-card`, `text-muted-foreground`, `bg-practice-blue`), which is the lever that lets us re-skin by redefining variables rather than editing every className.

## Goals / Non-Goals

**Goals**
- One coherent Immersion Cinema identity across all four views + the global header.
- Two warm variants (cinema-light `:root`, cinema-dark `.dark`) on the same gold palette, both WCAG AA for text.
- Reusable primitives so the four views compose the same building blocks.
- Preserve i18n, keyboard/focus accessibility, reduced-motion, and the theme toggle.

**Non-Goals**
- Any domain/port/storage change. Real transcript data. Replacing `NativeVideoPlayer`. Keeping the studio theme in parallel.

## Decisions

### D1. Re-skin by redefining CSS variables, not by editing every className

Redefine the existing semantic tokens in `globals.css` (`--background`, `--foreground`, `--ink`, `--card`, `--muted-foreground`, `--signal-yellow`, `--practice-blue`, `--studio-paper`, `--border`, `--primary`, `--ring`, …) to the cinema palette for both `:root` and `.dark`. Existing utilities inherit the new look automatically; components change only where **layout/structure** differs from today (new primitives, poster grid, tabs). This is the Tailwind-v4 idiomatic path and minimizes churn and regression surface.

Mapping (semantic → cinema): `signal-yellow`→gold accent, `practice-blue`→gold/amber (retire the blue), `studio-paper`→panel, `ink`→cream. Add cinema-specific tokens where no semantic slot fits: `--glow`, `--letterbox`, `--panel-2`, `--gold`, `--amber`.

### D2. Design an accessible cinema-**light** variant (not in the mockups)

The mockups are dark-only, but the chosen strategy is cinema-light + cinema-dark. Gold `#e7b64c` on light paper fails AA for text, so the light variant uses a **deeper bronze** (~`oklch(0.55 0.12 75)`, ≈`#a8781f`) for text/accents while keeping bright amber only for large fills/large text and glows. Light background is warm ivory (not pure white). All color pairs used for text MUST hit AA (4.5:1 body, 3:1 large). The dark variant maps 1:1 to the mockup values (already AA).

### D3. Poster art comes from existing `*-snapshot.jpeg` frames

Each lesson folder already holds a snapshot frame. `PosterCard` uses the module's first lesson snapshot (served via `BlobStore` URL) as the poster image behind the radial glow, with a CSS-glow fallback when absent. No new storage path.

### D4. `PosterCard` is one primitive, parameterized per view

`home` (featured "Welcome"), `course` (10-episode grid), and `module` (hero + row thumbnails) all reduce to one `PosterCard` with props: `number`, `title`, `glowOnly | posterUrl`, `size`, `badge`, `playAffordance`. Avoids three near-duplicate cards.

### D5. Course view retires `CourseOverviewTrack` in favor of the poster grid

Per the locked decision, the interactive practice track is replaced by the 5×2 `PosterCard` grid. `CourseOverviewTrack` (+ its stories/tests) is removed from the course composition. Keep the file only if another view still imports it (grep confirms it does not) — otherwise delete to avoid dead code.

### D6. Lesson notes: derive ES/EN columns by splitting the bilingual `readme.md`

`findLessonNotes` already returns the bilingual markdown (ES paragraph then EN paragraph). A pure presentational splitter (`splitBilingualNotes(markdown) → { es, en }`) lives in the lesson-view layer (not the domain): heuristic = first block ES, remainder EN, with a single-column fallback when the split is ambiguous. Rendered through the existing safe `Markdown` component (no raw HTML).

### D7. Transcript tab is present but disabled

Notes/Transcript render as a tab pair for visual fidelity. Transcript is `aria-disabled`, non-focusable-activatable, and shows a localized "not available" state. No transcript data is invented.

### D8. Cinema microcopy is localized, content is not

New interface strings (`nowStreaming`, `limitedSeries`, `season`, `episode`, `feature`, `openCourse`, `myList`, `startCourse`, `markComplete`, `español`, `english`, `transcriptUnavailable`, `upNext`, `resources`, `courseOutline`, …) go into `src/messages/{en,es,pt}.json`. Lesson `readme.md` content is untouched.

### D9. Header chrome is a client seam that stays SSR-safe

`layout.tsx` gains the brand + section eyebrow (server) while `LocaleSwitcher`/`ThemeToggle` remain the existing client components, only re-styled as chips. The section label (`HOME/COURSE/MODULE/LESSON`) derives from the route segment, computed server-side.

## Testing strategy

Per repo rule, each behavior is placed at its cheapest reliable layer, mirroring existing patterns.

- **Vitest unit** — `splitBilingualNotes` (D6): ES/EN split happy path, single-block fallback, empty input. New pure function; mirrors `src/domain`/`src/lib` unit style but lives under `src/components/lesson-view/...` as a pure helper.
- **Vitest component + RTL** — colocated `*.test.tsx` mirroring existing component tests (e.g. `inline-lesson-notes.test.tsx`, `course-card` tests):
  - `PosterCard`: renders number/title/badge, poster `<img>` alt, glow-only fallback, play affordance is a real control with an accessible name.
  - `CinemaBackground` / `SectionChrome` / `Brand`: render landmarks, section eyebrow reflects the passed segment.
  - Home / CourseOverview (poster grid) / ModuleOverview / LessonView: correct headings, links are locale-aware (`lessonPath`), poster grid has 10 items, lesson tabs expose Notes active + Transcript disabled, ES/EN regions labelled.
  - Contrast: assert accent utilities resolve to the AA token (guard test on the computed CSS var, or a documented snapshot) so a future token edit can't silently regress D2.
- **Playwright e2e** — extend `e2e/` for the journey `/en` → course → module → lesson: header brand + section label present, "Start course" reaches a lesson, video hero + Mark-as-complete reachable by keyboard with visible focus, Transcript tab is disabled. Reduced-motion honored (no assertion beyond existing global handling).
- **Storybook** — stories for each new primitive following the folder-per-component convention.

Verification: `pnpm test:run` for the touched areas and `pnpm test:e2e` for the journey.

## Risks / Trade-offs

- **Token remap regressions (D1):** redefining `practice-blue`/`signal-yellow` recolors every consumer, including views not in scope (e.g. error/empty states). Mitigation: grep all consumers, screenshot-review light+dark, keep a semantic mapping table in `globals.css` comments.
- **Cinema-light is invented (D2):** not validated by a mockup; risk of an off-brand light theme. Mitigation: derive from the same hues, gate on AA, review before merge.
- **ES/EN split heuristic (D6):** notes that aren't cleanly two-block will mis-split. Mitigation: conservative fallback to single column; unit-tested.
- **Snapshot posters (D3):** frames may be low-res or visually noisy behind gold text. Mitigation: dark gradient scrim + glow over the image; fallback to glow-only.

## Migration Plan

Presentational, no data migration. Order: tokens/primitives first (foundation) → header chrome → per-view rewires (home → course → module → lesson) → i18n → tests. Each view is independently shippable once tokens land, so the change can be reviewed view-by-view. `CourseOverviewTrack` removal is the only deletion; confirm no remaining imports before deleting.

## Open Questions

- Cinema-light exact values: approve the derived bronze/ivory ramp during apply, or should light simply mirror dark (dark-only in practice)?
- Keep `CourseOverviewTrack` as an unused component for potential reuse, or delete it (D5)?
- "+ My List" button on Home — decorative (no-op) for now, or out of scope entirely?

## Known issue — pre-existing e2e seed mismatch (not this change)

`getCoursePlatformDeps()` serves the content seed **or** the A1 seed, selected by
`USE_COURSE_CONTENT_SEED` — they are mutually exclusive, never both. Both `.env`
and the Playwright `webServer` command (`playwright.config.ts`) hardcode
`USE_COURSE_CONTENT_SEED=1`, so the content seed is the only one served.

`e2e/lesson-page.spec.ts` targets the **A1 seed** course (`english-a1-pronunciation`),
which is therefore not served, so those tests fail with "couldn't find this course".
This predates this change (it touches no seeds/domain/adapters — see git) and is a
test-infrastructure decision for the `lesson-page` capability owner. The Lesson Page
redesign is fully covered under the served seed by `e2e/course-catalog.spec.ts`
(breadcrumb, video, up-next) and `e2e/cinema-theme.spec.ts` (chrome, tabs,
mark-complete). **Recommended owner fix:** either run `lesson-page.spec.ts` as a
separate Playwright project whose `webServer` omits the flag, or migrate it to the
content seed. Out of scope for this re-skin.

## Post-verify cleanups (applied)

- Deleted now-unused `InlineLessonNotes` (replaced by `LessonNotesTabs`) and
  `CourseCard` (home no longer renders it); `markdown.tsx` is retained (used by the tabs).
- `FeaturedCourse` no longer passes the `Welcome` headline when a poster image is
  present, so it doesn't double with text baked into the snapshot frame.
- `PosterCard` uses `next/image` (`fill`) instead of a raw `<img>`, clearing the
  `@next/next/no-img-element` lint warning.

