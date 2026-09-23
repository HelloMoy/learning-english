## 1. Copy and message keys

- [x] 1.1 Add the new `Profile.*` keys to `src/messages/en.json`, `es.json` and `pt.json`: the
      eyebrow's intro line, `Profile.progress.*` (ring label, video count, tickets, prizes),
      `Profile.sections.*` (identity, account, preferences, deleteAccount) with the Identity
      supporting line, `Profile.preferences.*` (language and theme labels) and `Profile.saveBar.*`
      (the unsaved-changes line). Keep `heading`/`intro` only if still used. (TDD: the repo's
      message-parity test covers the three files — run it red first by adding keys to `en.json`
      alone, then fill `es` and `pt`.)

## 2. Progress band

- [x] 2.1 `ProfileCardBand` — the card beside the progress panel: ring with percentage, completed-of-total
      count, bar, tickets earned, prizes claimed, zero state before hydration, no layout shift.
      (TDD: test → impl, `src/components/profile-card-band/profile-card-band.test.tsx` first.)
- [x] 2.2 JSDoc on `ProfileCardBand` and its props, and `profile-card-band.stories.tsx` with a
      started learner, a learner with nothing watched, and a finished level — story copy from
      `.storybook/messages/*.json` under `Stories.*`.

## 3. Section wrapper

- [x] 3.1 `ProfileSection` — a `<section>` labelled by its own `h2`, with an optional supporting
      line and a slot for its content. (TDD: test → impl.)
- [x] 3.2 JSDoc and `profile-section.stories.tsx`.

## 4. Save bar

- [x] 4.1 `ProfileSaveBar` — docked to the bottom of the viewport, present only when there are
      unsaved changes, carrying the unsaved-changes line, Discard, Save (unavailable on a blank name
      or while saving) and the saved confirmation as a `role="status"`, with
      `env(safe-area-inset-bottom)` in its own padding. (TDD: test → impl.)
- [x] 4.2 JSDoc and `profile-save-bar.stories.tsx` (dirty, saving, saved).

## 5. Page composition

- [x] 5.1 Pass `levels={catalogLevels(entries)}` from `src/app/[locale]/profile/page.tsx` to
      `ProfileView`, and give the page's `main` the constant bottom padding the bar needs.
      (TDD: extend `src/app/[locale]/(account)/account-pages.test.tsx` or the profile page test
      first.)
- [x] 5.2 Rewrite `ProfileView`'s layout: `h1` is the learner's name with the eyebrow above it, then
      `ProfileCardBand`, then the single column of `ProfileSection`s — Identity (name field +
      `AvatarPicker`), Account, Preferences, Delete account — with the editor's state machine
      unchanged. (TDD: update `profile-view.test.tsx` red first for the new outline and the bar.)
- [x] 5.3 Move the Preferences rows in: `LocaleSwitcher` and `ThemeToggle` each in a labelled row,
      the visible label a `<span>` so each control keeps one accessible name. (TDD: test → impl.)
- [x] 5.4 Strip `AccountSection`'s and `DeleteAccountSection`'s own headings and `border-t`/`pt-8`
      framing now that `ProfileSection` owns them, leaving their behaviour, status messages and
      namespaces untouched. Update their tests and stories to match. (TDD: update tests red first.)
- [x] 5.5 Reshape the in-page `ProfileShell` skeleton and `src/app/[locale]/profile/loading.tsx` to
      the new layout — band first, then sections. (TDD: update the skeleton assertions first.)

## 6. Verification

- [x] 6.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix every failure at its
      root.
- [x] 6.2 Run the browser flows that touch this page: `pnpm test:e2e` for `home.spec.ts`,
      `account-identity.spec.ts` and `account-deletion.spec.ts` against a dev server, with
      `--workers=1` to separate flakes from regressions.
- [x] 6.3 Check the page myself in the browser with Playwright MCP, dark theme, at 1440 px and
      390 px: the band, the four sections, the bar appearing only when dirty, and nothing shifting
      when progress arrives.
