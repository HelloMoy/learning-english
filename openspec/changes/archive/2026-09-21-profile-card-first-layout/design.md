## Context

`ProfileView` is one component holding the whole page: a 12-column grid whose left seven columns
stack the header, the name field, the avatar picker, the button row, the saved status,
`AccountSection` and `DeleteAccountSection`, and whose right five columns hold `CardPreview`. The
right column is `lg:sticky` but has only the card in it, so on a desktop screen it ends around a
third of the way down and leaves the rest empty — and it has got worse as the account forms lengthened
the left column.

Everything the new layout needs already exists:

- `LearnerCard` takes `size="large"` and a `progress` tally.
- `useCourseWatchProgress(lessonRuntimes)` gives `completedCount`, `lessonCount` and
  `completedFraction` for the card's level.
- `useLearnerAchievements(levels)` gives `ticketsEarned` and `prizesRedeemed` across the catalog.
- `ProgressRing` draws the ring, `AvatarPicker` the avatars, `AccountSection` and
  `DeleteAccountSection` their own content.
- `LocaleSwitcher` and `ThemeToggle` are the header's own controls.
- `src/app/[locale]/profile/page.tsx` already calls `loadCatalogEntries()`, which is
  `cache()`-wrapped per request, and `catalogLevels(entries)` already exists for the achievements
  route.

So this is a composition change, not a data change. The work is in splitting `ProfileView` into
parts, adding three small components, and moving the controls.

## Goals / Non-Goals

**Goals:**

- The page opens with the card and what the learner has done, not with a form.
- Every part of the page sits under a heading that names it, in a single column.
- Save and Discard are reachable from anywhere on a long page, and absent when there is nothing to
  save.
- No layout shift when progress arrives after hydration.
- The new components follow the project's rules: folder-per-entity, stories, colocated tests, JSDoc,
  and every string through `next-intl` in `en`, `es` and `pt`.

**Non-Goals:**

- Autosave, undo, or any change to what Save and Discard do.
- New routes, rails or tabs.
- Changing `AccountSection`, `ChangePasswordSection`, `ChangeEmailSection` or the delete dialog's
  behaviour.
- Streaks and email reminders (no data behind them).

## Decisions

### 1. Three new components, not one bigger `ProfileView`

- `src/components/profile-card-band/profile-card-band.tsx` — the card plus the progress panel.
- `src/components/profile-section/profile-section.tsx` — a `<section>` with an `h2` and an optional
  supporting line, used by Identity, Account, Preferences and Delete account.
- `src/components/profile-save-bar/profile-save-bar.tsx` — the docked bar.

`ProfileView` keeps the editor's state machine (draft name and avatar, `isDirty`, `isSaving`,
`isSaved`) and hands values down. Alternative considered: one component with the new markup inline.
Rejected — `ProfileView` is already at the limit of what one file should hold, and the band and the
bar both want stories and tests of their own.

`AccountSection` and `DeleteAccountSection` keep their own headings today. They will render *inside*
`ProfileSection`, which owns the `h2`, and lose their internal heading and `border-t`/`pt-8` framing
so the page has one section rhythm rather than two. Their behaviour, their status messages and their
translation namespaces stay exactly as they are.

### 2. The band gets the catalog from the route, not a new fetch

`page.tsx` passes `levels={catalogLevels(entries)}` alongside the `level` and `lessonRuntimes` it
already passes. `ProfileCardBand` calls `useCourseWatchProgress` for the card's level and
`useLearnerAchievements` for the catalog totals.

Note: `useLearnerAchievements` also *records* tickets for lessons that already count as complete.
That write is idempotent (insert-or-ignore per lesson) and is the same effect the Achievements page
has, so visiting the Profile page can only bring a learner's tickets up to what they have already
earned. Alternative considered: a read-only variant of the hook. Rejected — it would duplicate the
derivation to avoid a write that is already the rule everywhere else.

### 3. Progress before hydration shows zero, and reserves its space

`CardPreview` already uses `useIsHydrated` to pass `0` before hydration; the band keeps that rule for
the ring, the count, the bar and both counters. Every figure sits in a fixed-height row, so when the
real numbers arrive nothing below moves. The card's own progress line keeps behaving exactly as it
does today.

### 4. The save bar is `fixed`, and the page always reserves room for it

The bar is `fixed inset-x-0 bottom-0`, rendered only while `isDirty`, with
`padding-bottom: env(safe-area-inset-bottom)` added to its own padding so it clears the iPhone home
indicator. The saved confirmation (`role="status"`) moves into the bar's place: the bar carries
"unsaved changes" while dirty, and the confirmation replaces it briefly after a save.

The Profile page's `main` gets a constant bottom padding the height of the bar, whether or not the
bar is up. Alternative considered: a spacer rendered only while dirty — rejected, because it would
shift the page's content the moment the learner types.

### 5. Preferences reuses the header's controls, with visible labels

`LocaleSwitcher` and `ThemeToggle` are buttons carrying their own accessible names, so the visible
label beside them is a `<span>` in a labelled row, not a `<label htmlFor>` pointing at a dropdown
trigger or a switch. This keeps one accessible name per control instead of two.

### 6. The heading outline

The page's `h1` becomes the learner's name; the eyebrow keeps naming the page. Each section's title
is an `h2`. `AccountSection`'s current `h2` and `DeleteAccountSection`'s current `h2` become the
section's, so the page has exactly one `h1` and four `h2`s and no skipped levels.

### 7. The page reads in a 1024 px column, and each section's content at a form's width

Taken from the browser check rather than the mockup: with the sections stacked full width, the
change-password and change-email fields stretched to 1300 px on a desktop screen — wider than they
ever were in the old seven-column layout. So `ProfileView` centres itself at `max-w-5xl`, and
`ProfileSection` keeps its *content* at `max-w-3xl` while the heading crosses the column. The save
bar matches the page's column rather than the window, so its controls sit under the content they act
on. The loading shell uses the same column, so nothing jumps when it is replaced.

## Risks / Trade-offs

- **The name appears three times** (the `h1`, the card, the Identity field) → the `h1` is the *stored*
  name and does not follow keystrokes; only the card previews the draft. The Identity section says so
  in one line.
- **A fixed bar can cover content on a short viewport** → the constant bottom padding on `main` is
  sized to the bar, and the bar is only two rows tall on a phone.
- **Existing tests assert the old shape** → `profile-view.test.tsx` (11 tests) and
  `account-pages.test.tsx` need updating; `e2e/home.spec.ts` picks an avatar before pressing "Save
  changes", so it still passes, but it is re-run to prove it.
- **`useLearnerAchievements` writes on page load** → idempotent, and documented in decision 2.
- **Turbopack serves stale `globals.css`** when tokens or utilities change → if the new layout needs a
  CSS change, the dev server is restarted with `.next` removed before judging it in the browser.

## Migration Plan

Not applicable: no data, storage or route changes. The change is a re-composition of one page, ships
in one branch, and reverts by reverting the branch.

## Testing strategy

Red → Green → Refactor on every task, per `AGENTS.md`.

| Behaviour | Layer | Where |
| --- | --- | --- |
| The band's ring, count, bar and counters, including the zero state before hydration | Vitest + RTL | `src/components/profile-card-band/profile-card-band.test.tsx`, mirroring `learner-card.test.tsx`'s use of a progress tally |
| The section wrapper renders its `h2` and associates it with the `<section>` | Vitest + RTL | `src/components/profile-section/profile-section.test.tsx` |
| The bar is absent when clean, appears when dirty, disables Save on a blank name, and carries the confirmation | Vitest + RTL | `src/components/profile-save-bar/profile-save-bar.test.tsx` |
| Page composition: `h1` is the learner's name, the four `h2`s in order, editing raises the bar, saving stores and confirms, discarding restores | Vitest + RTL | `src/components/profile-view/profile-view.test.tsx` (existing file, updated), with the stub `LearnerProfileRepository` it already injects |
| Language and theme rows render and are labelled | Vitest + RTL | `profile-view.test.tsx`, reusing the `next-intl` provider helper the file already uses |
| The whole page in a browser: pick an avatar, save from the docked bar, header updates | Playwright | `e2e/home.spec.ts` "Profile" describe (existing, re-run) |
| The account and deletion flows still work in the new sections | Playwright | `e2e/account-identity.spec.ts` and `e2e/account-deletion.spec.ts` (existing, re-run) |
| Every new string in `en`, `es`, `pt` | Vitest | the message-parity test the repo already runs over `src/messages/*.json`, plus stories checked in the three locales |

Storybook: `profile-card-band.stories.tsx`, `profile-section.stories.tsx` and
`profile-save-bar.stories.tsx`, under the `Components/` prefix, with story copy from
`.storybook/messages/*.json` under `Stories.*` — never from `src/messages`.

Visual check is done here, in the browser with Playwright MCP at desktop and phone widths, in the
dark theme, before the change is called done.

## Open Questions

- Does the Preferences section's language control belong on this page at all, given the site header
  already carries both? It is in the approved design, so it ships; if it reads as duplication in the
  browser check, it is the one part that can be dropped without touching anything else.
