## Context

The header is a two-item flex row: `Brand` on the left, `LocaleSwitcher` + `ThemeToggle`
on the right, `justify-between` with `gap-4` and `px-4` (`sm:px-11`).

Every piece of it is intrinsically unshrinkable:

| Piece | Measured width | Why it cannot shrink |
| --- | --- | --- |
| `Brand` wordmark | 203px | `LEARN·ENGLISH` contains no spaces, so there is no wrap opportunity |
| `LocaleSwitcher` | 179px | `Language:` label + `<select>` sized to its longest `<option>` |
| `ThemeToggle` | 72px | `◐` + theme name |

A flex item's default `min-width: auto` floors it at its intrinsic content width, so
`flex-shrink: 1` never engages. The row's minimum is `203 + 16 + 261 + 32 = 512px`.
Below that the row overflows its container, and because nothing clips it, the overflow
propagates to `document.scrollWidth`.

Measured thresholds on the running app: 320px → 484px document (`/es`), 390px → 496px,
480px → 489px, 560px → clean, 640px+ → clean. So the break is below ~490px — precisely
the phone range, and nothing above it.

Two consequences follow from the same root cause and disappear with it:

- `ThemeToggle` sits at x = 424..496 in a 390px viewport — entirely off-screen.
- `CinemaBackground` is sized to the viewport while the document is wider, leaving an
  unpainted band down the right of every route.

Separately, `module-overview.tsx:134` applies `truncate` to the lesson title. That is
not an overflow bug — the row is correctly contained — but on a phone it cuts titles to
a prefix their neighbours share, which is its own failure.

## Goals / Non-Goals

**Goals:**

- `document.scrollWidth === clientWidth` on every route, every locale, from 320px up.
- Locale switching and theme toggling reachable and operable at 320px, with their
  accessible names unchanged from desktop.
- Lesson titles distinguishable from one another in the module list on a phone.
- The fix degrades gracefully: a future longer translation shrinks the layout rather
  than reintroducing document overflow.

**Non-Goals:**

- A new navigation pattern (hamburger, bottom bar). See the proposal's Non-goals.
- Touch-target work outside the header controls.
- Any change at 560px and above, where measurement shows the layout already fits.

## Decisions

### D1. Fix the header structurally *and* tune the type scale, not one or the other

Two mechanisms, deliberately layered:

1. **Structural** — the row's children get `min-w-0` so `flex-shrink` can actually
   engage, and the brand gets `shrink` with `overflow-hidden`. This makes overflow
   *impossible* regardless of content: the worst case becomes a clipped wordmark, never
   a sideways-scrolling document.
2. **Cosmetic** — a smaller mobile type scale and label-free chips so the structural
   floor is never reached in practice and nothing actually clips.

Alternatives considered:

- *Structural only.* The wordmark would clip to `LEARN·ENGLI` at 320px. Correct but
  ugly, and the brand is the one thing the header exists to show.
- *Cosmetic only* (responsive sizes, no `min-w-0`). This is the tempting minimal fix and
  it is fragile: it holds exactly as long as every translation stays under the budget
  below. A single longer label in a future locale silently restores the bug. The
  measured cause of today's failure *is* a missing `min-w-0`; fixing the symptom while
  leaving the cause is what lets it come back.

Keeping both means the e2e guarantee is upheld by structure and the visual result by
tuning.

### D2. Below `sm` (640px): the locale control becomes a menu-backed button

**An earlier revision of this decision was wrong and measurement killed it.** It proposed
keeping the native `<select>` and merely dropping its `Language:` prefix, with the chip
showing the locale code `ES`. That is not implementable: a native `<select>` renders the
text of its *selected `<option>`*, so its width is dictated by the longest option label
and cannot be swapped for a short code with CSS. Getting `ES` out of a `<select>` would
take either JavaScript-swapped option labels (a hydration hazard) or two duplicated
controls (an accessibility hazard). Neither is worth it for a control that works.

The measured budget with the `<select>` kept and only its prefix dropped, at 320px:

```
320 − 32 (px-4)              = 288 available
Locale chip minus prefix     = 106   (measured in the DOM, /es)
Theme chip (44×44)           =  44
gap-4 + gap-2.5              =  26
                               ---
leaves for the wordmark        112   — but the wordmark is 122px at 12px/0.14em,
                                       already below legibility. Does not fit.
```

So the locale control is replaced with a **button that opens a menu**:

```
320 − 32 (px-4)                        = 288 available
Brand @ 13px / 0.18em tracking         = 139   (measured; 203 at today's 17px / 0.28em)
gap-4                                  =  16
Locale button ("ES" + chevron, ≥44 tap)=  56
gap-2.5                                =  10
Theme chip (icon only, 44×44)          =  44
                                         ---
                                         265  ≤ 288, 23px slack
```

A button's width is set by the text *it* renders, not by its widest option, so `ES` on a
phone and `Español` from `sm` up is a plain `sm:hidden` / `hidden sm:inline` pair. The
control keeps a **visible value** — a language selector whose current value is invisible
is a worse control than a cramped one.

The theme chip goes icon-only. `◐` already carries the meaning and the toggle is a cycle,
so its label is the least load-bearing text in the header.

`sm` (640px) is the switch point: it is an existing breakpoint, it is where the section
eyebrow already appears (`sm:inline` in today's header), and it sits comfortably above
the measured ~490px failure point. No new breakpoint is introduced.

Alternatives considered and rejected:

- *`flex-wrap` onto a second line.* Measured live: this works — `scrollWidth` 489 → 320
  at 320px in `/es`, header 64px → 89px, wordmark untouched, no label dropped, pure CSS.
  It is the cheapest correct fix and it was put to the user against this one. Rejected in
  favour of the menu on the user's call: it costs 25px of permanent `sticky` header
  height on phones and leaves the header two lines tall on the smallest screens.
- *Keeping the `<select>` and clipping the language name.* Fits, but renders
  `Portugu…` as the control's value — the answer to "what language am I in" becomes
  unreadable, which is the one thing this control exists to say.

### D3. The menu is a shared primitive, not inlined into the locale switcher

`ui-dialog-primitive` set the precedent: Radix behaviour this project must not
re-implement gets wrapped once under `src/components/ui/<name>/` with `data-slot`
attributes and JSDoc, then composed. The locale menu follows it —
`src/components/ui/dropdown-menu/dropdown-menu.tsx`, built on the same `radix-ui`
unified package, no new dependency.

The primitive is scoped to what a single-choice menu needs: `DropdownMenu`,
`DropdownMenuTrigger`, `DropdownMenuPortal`, `DropdownMenuContent`,
`DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuItemIndicator`.
Sub-menus, checkbox items, labels, separators, and shortcut slots are **not** ported.
Shipping the full shadcn registry surface for one consumer is speculative generality;
the parts are a `pnpm dlx shadcn@latest add` away when something actually needs them.

Radix gives the semantics that make this a real replacement for the `<select>`:
`menuitemradio` roles, arrow-key roving focus, type-ahead, `Escape` to dismiss, focus
returned to the trigger on close.

### D4. Accessible names must not depend on visible text

`ThemeToggle` already computes `aria-label={`${t("label")}: ${t(theme)}`}`, so hiding its
visible text costs assistive technology nothing.

The locale trigger takes the same shape: `aria-label={`${t("label")}: ${t(<active>)}`}` —
"Language: English" — so its accessible name is identical at 320px and at 1440px even
though its visible text changes from `ES` to `Español`. Naming it from the visible text
instead would make a screen reader announce "E S" on a phone.

The locale codes come from `routing.locales` uppercased, **not** from message files.
`EN`/`ES`/`PT` are ISO 639-1 codes, identical in every locale; routing them through
`next-intl` would invite three translations of a constant to drift apart.

### D5. 44×44 hit areas come from padding, not from a bigger chip

The chips grow their tap target with padding and `min-h`/`min-w` rather than a larger
visual box, so the cinema chip aesthetic survives. This gets simpler with the menu: the
hit area is the trigger `<button>` itself, so `min-h-11 min-w-11` on it is the whole
story — no wrapping `<label>` whose padding would not have counted toward the
`<select>`'s own hit area.

### D6. `sm:truncate` instead of `truncate` on the module row title

`truncate` is three properties (`overflow`, `text-overflow`, `white-space`). Applying it
only from `sm` up means the mobile default — normal wrapping — needs no counter-utility.
The row is `flex items-center`, so a wrapped title simply makes the row taller; the
eyebrow, completion mark, and "Open" action keep their positions and the "Open" action
keeps its `shrink-0`.

### D7. Viewport-sized e2e via `test.use`, not a new Playwright project

`playwright.config.ts` defines three desktop projects. Adding a mobile project would
multiply every existing spec across a fourth device for no benefit, and editing the
Playwright config is a tooling change this change does not need. The new spec sets its
own viewport per `describe` block with `test.use({ viewport })`, which runs under all
three existing browser projects and keeps the config untouched.

## Risks / Trade-offs

- **The 23px slack at 320px is thin.** A future locale with a longer code, or a font
  fallback with wider glyphs, eats into it. → D1's structural layer absorbs this: the
  layout shrinks instead of overflowing, and the e2e spec fails loudly if it ever does
  overflow. The slack is a comfort margin, not the guarantee.
- **Shrinking the wordmark weakens the brand on mobile.** Accepted deliberately: the
  alternative is a wordmark at full size that pushes a reachable control off-screen.
- **Replacing a native `<select>` is a real regression risk.** The native control gets
  the OS language picker on a phone, keyboard type-ahead, and form semantics for free;
  a Radix menu re-earns each of those and can lose one in a way CSS-level review will
  not catch. → Radix supplies roving focus, type-ahead, `Escape`, and focus restoration,
  and the component tests assert selection-by-keyboard and focus-return explicitly
  rather than trusting the library. This risk is the price of the chosen approach and
  was named when the choice was made.
- **The locale control's role changes from `combobox` to `button` + `menuitemradio`.**
  Any test or future code selecting it by `getByRole("combobox")` breaks. → The existing
  `locale-switcher.test.tsx` is rewritten as part of task 1; there are no other callers
  (verified: the component is composed only by `SiteHeader`).
- **A trigger named from its visible text would announce "E S".** → D4 names it from the
  locale's full label instead, and the component test asserts the accessible name is
  identical regardless of which visible variant renders.
- **e2e runtime grows.** Six routes × three locales × two widths is 36 navigations. →
  Scoped to one spec file, assertions are a single `evaluate` per page, and the existing
  suite already navigates comparable numbers.
- **Wrapped titles make long modules much taller.** Module 10's 16 rows grow by roughly a
  line each. → Accepted: a taller list the learner can read beats a compact one they
  cannot.

## Testing strategy

Layers, and what each is responsible for:

**Vitest component + RTL** — behavior that survives without layout. jsdom has no layout
engine, so these tests assert *accessible names and rendered content*, never geometry.

- `src/components/ui/dropdown-menu/dropdown-menu.test.tsx` (new): the primitive portals
  its content, exposes `menu` / `menuitemradio` roles, marks the checked item, closes on
  `Escape`, and returns focus to the trigger. Mirrors `ui/dialog/dialog.test.tsx`,
  including its note that portalled content is reached through `screen`, not the
  container RTL returns.
- `src/components/locale-switcher/locale-switcher.test.tsx` (rewritten, see the role
  change in Risks): the trigger is reachable as
  `getByRole("button", { name: /language/i })`; opening it exposes three
  `menuitemradio` items with the active locale checked; choosing one calls
  `router.replace(pathname, { locale })`; the accessible name stays `Language: <full
  name>` regardless of which visible variant renders (the D4 guard); and the menu is
  operable by keyboard end to end, with focus returning to the trigger on close.
- `src/components/theme-toggle/theme-toggle.test.tsx` (extend): the button keeps its
  `Theme: <name>` accessible name with its visible text hidden, in both the hydrated and
  the pre-hydration placeholder branches.
- `src/components/site-header/site-header.test.tsx` (extend): the header still mounts
  brand, locale switcher, and theme toggle, and all three are in the accessibility tree.
  Mirrors the existing mock setup in that file (`next-intl`, `next-themes`, and
  `@/i18n/navigation` stubbed directly, no real providers).
- `src/components/module-overview/module-overview.test.tsx` (extend): the full lesson
  title is present in the DOM — truncation is CSS-only, so the assertion is that no
  JavaScript-side shortening was introduced.

**Playwright e2e** — the actual guarantee, because it is the only layer with a real
layout engine. New `e2e/mobile-viewport.spec.ts`, following the seed-import pattern of
`e2e/cinema-theme.spec.ts` (route constants derived from `seedContentModules` /
`seedContentLessonRows`):

- Across the six routes × `en`/`es`/`pt` × 320px and 390px:
  `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
  This is the `responsive-viewport-fit` "no horizontal scroll" requirement, and the
  regression guard for the whole change.
- At 320px: the locale switcher and theme toggle both have bounding boxes fully inside
  `[0, clientWidth]` — the "every control stays within reach" requirement.
- At 320px: each of those two controls reports `boundingBox()` of at least 44×44 — the
  `cinema-home` hit-area scenario.
- At 320px on a module route with shared-prefix titles: two adjacent rows expose
  different accessible names and neither renders an ellipsis — the
  `cinema-module-overview` legibility requirement.

**Storybook + Playwright MCP** — visual confirmation, driven by me, not handed back:
narrow-viewport stories for `SiteHeader`, `LocaleSwitcher`, `ThemeToggle`, and
`ModuleOverview` (a module with shared-prefix titles), reviewed at 320px and 390px in
both themes.

**Manual sweep** — after implementation, re-run the original audit with Playwright MCP
against the dev server: the six routes at 320/390px in `en` and `es`, confirming the
measured `scrollWidth` figures from Context are gone and the background band with them.

## Outcome

Implemented as designed, with D2 amended mid-implementation (recorded above) and one
finding worth carrying forward.

Measured after the change, at 320px on `/es` — the worst case for label length:

| | before | after |
| --- | --- | --- |
| `document.scrollWidth` | 484 | **320** (= `clientWidth`) |
| wordmark | 203px | 139px |
| locale control | 154px, value `Español` | 61px, value `ES`, 44×44 hit area |
| theme toggle | 72×30, off-screen at x=424 | 44×44, right edge at 304 |
| header height | 64px | 76px |

Budget actual: 139 + 16 + 61 + 10 + 44 = 270 ≤ 288 available, against the 265 predicted.

`CinemaBackground` needed no change — the band was a symptom of document overflow and
went with it, as task 6.5 assumed.

### Finding: the e2e suite is limited by the dev server, not the app

Building the route sweep surfaced a pre-existing problem this change does not fix.

`playwright.config.ts` runs the suite against `next dev`. The course overview streams a
poster gallery per module; measured on its own it loads in **279ms in WebKit** and
reports `scrollWidth === clientWidth`. Under three browser projects × four workers all
requesting it at once, the dev server stalls past 30s and the navigation times out.

This already fails `course-overview.spec.ts` (7 tests on WebKit) and
`lesson-playback-resume.spec.ts` (4 on Chromium) on a clean checkout — both reproduced
with this change stashed. Adding ~75 navigations makes it worse across the whole suite:
32 failures fully parallel, versus 1–6 for the same code at `--workers=1`.

Mitigated here by opting the sweep out of `fullyParallel` and trimming the redundant
route × locale cross product. The real fix is to run e2e against `next build &&
next start`, which is a `playwright.config.ts` edit — tooling, and its own change.
