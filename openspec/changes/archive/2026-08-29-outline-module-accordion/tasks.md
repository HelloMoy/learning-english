## 1. Red — invert the existing assertion

- [x] 1.1 (TDD: test first) In `src/components/lesson-view/module-list/module-list.test.tsx`,
      change the assertion at line 66 from `screen.getByRole("link", { name: "Module A" })`
      to `screen.getByRole("button", { name: "Module A" })`. Run `pnpm test:run` and
      confirm it FAILS — this is the red that opens the cycle. Do not touch
      `module-list.tsx` yet.

## 2. Component behavior (Vitest + RTL)

Each task in this group is `(TDD: test → impl)`: add the failing test, watch it fail,
then write the minimal change in `module-list.tsx` to make it pass. Mirror the
`user-event` setup in `mark-as-complete-button.test.tsx` and `lesson-notes-tabs.test.tsx`;
keep the existing `WHEN … THEN …` naming and Arrange/Act/Assert comments.

- [x] 2.1 (TDD: test → impl) The module title renders as a `<button type="button">`
      instead of a `<Link>`, and no link carries the module title as its accessible
      name. Minimal impl: swap the `<Link>` for a `<button>`, drop the
      `moduleOverviewPath` and `Link` imports from `module-list.tsx` (leave
      `@/i18n/lesson-routes` itself untouched — `LessonList` and the breadcrumb still
      use it).
- [x] 2.2 (TDD: test → impl) On mount, the module owning the current lesson reports
      `aria-expanded="true"` and shows its lessons; a second, inactive module reports
      `aria-expanded="false"` and its lesson titles are absent from the DOM (assert with
      `queryBy…` returning `null`, per design D3 — collapsed lessons are unmounted, not
      hidden).
      **Outcome:** this test passed on arrival — the derived `isOpen = mod.id === currentModuleId`
      plus the `aria-expanded` added in 2.1 already satisfies mount-time behavior, so no
      state was needed here. It stands as a regression lock. The `useState` from design
      D2 is genuinely driven by 2.3 (the click), and is introduced there.
- [x] 2.3 (TDD: test → impl) `await user.click(...)` on a collapsed module's title
      reveals that module's lesson titles and flips its `aria-expanded` to `"true"`.
      Minimal impl: the click handler adds the module id to the set.
- [x] 2.4 (TDD: test → impl) Expanding a second module leaves the first module's lessons
      visible — both report `aria-expanded="true"` (the multi-open requirement; a
      single-id state would fail this). Requires a three-module fixture.
      **Note:** 2.4–2.6 went green on arrival — the `Set` state from 2.3 plus a native
      `<button>` already satisfy them. Verified they are not vacuous by mutating the
      toggle to an exclusive accordion, which turns 2.4 red as expected.
- [x] 2.5 (TDD: test → impl) Clicking an expanded module's title collapses it: its
      lessons leave the DOM and `aria-expanded` returns to `"false"`. Minimal impl: the
      handler removes the id from the set.
- [x] 2.6 (TDD: test → impl) Keyboard operation — `await user.tab()` reaches the module
      title and `{Enter}` / `{ }` toggles it. A native `<button>` satisfies this; the
      test locks the behavior against a future refactor to a `<div onClick>`.

## 3. Affordance, a11y polish, and docs

- [x] 3.1 (TDD: test → impl) Add the `ChevronRight` from `lucide-react` (design D5),
      `aria-hidden="true"`, rotated 90° via CSS when the module is open. Test asserts the
      icon is excluded from the accessible name — i.e. `getByRole("button", { name: "Module A" })`
      still resolves exactly, with no icon text leaking in.
- [x] 3.2 (impl only — styling, no behavior) Apply the project's focus ring and hover
      classes to the button so they match the current title styling
      (`focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none`,
      `hover:text-gold`), and give it the full-width left-aligned layout a disclosure row
      needs. Confirm no test regresses.
- [x] 3.3 (impl only — docs) Update the JSDoc block on `ModuleList` — it currently says
      "inactive modules are collapsed with a link to their module overview", which the
      change makes false. Describe the disclosure behavior and the multi-open semantics
      instead.
- [x] 3.4 Confirm no new i18n keys were introduced (design D4). If step 3.1 or 3.2
      surfaced a genuine need for a visually-hidden label, add it under
      `Components.ModuleList` in **all three** of `src/messages/{en,es,pt}.json` — never
      one locale only.

## 4. Storybook

- [x] 4.1 (impl only — stories) Extend `module-list.stories.tsx` with a story whose
      `currentLessonId` belongs to the first of three modules, so the collapsed state is
      reviewable. Give each module more than one lesson so expansion is visible. Do not
      mock `next-intl` (AGENTS.md § Storybook).
- [x] 4.2 Review the stories at `en`, `es`, and `pt` via the toolbar locale switcher and
      check the a11y addon panel reports no new violations on the disclosure button.
      **Outcome:** axe (wcag2a/2aa/21a/21aa) reports no violation on the disclosure
      button in any locale, and no i18n keys leak (the component renders no translated
      strings, confirming D4). One pre-existing `color-contrast` violation surfaced on
      the current-lesson row — `text-gold` on `bg-gold/10` at 4.42:1 — but it is rendered
      by the untouched `LessonList` and reproduces identically in the pre-existing
      `TwoModules` story, so it is out of scope here (see proposal § Non-goals) and is
      reported separately.

## 5. Regression check on the surrounding components

- [x] 5.1 Run the existing `outline.test.tsx` and `outline-drawer.test.tsx` unchanged and
      confirm they stay green — `ModuleList` becoming a client component must not break
      the mobile `<details>` branch or the desktop `<aside>` branch.
- [x] 5.2 Confirm `lesson-list.test.tsx` is untouched and green: lesson rows keep their
      locale-aware links and `aria-current`.

## 6. Verification

- [x] 6.1 Run `pnpm test:run` — all Vitest unit and component tests green.
- [x] 6.2 Run `pnpm test:e2e -- e2e/lesson-page.spec.ts` (the touched area). No e2e spec
      asserts on module-title links, so this is a regression check, not new coverage —
      per design § Testing strategy, no new Playwright test is added.
- [x] 6.3 Run `pnpm verify` (typecheck → format:check → lint → test:run) and fix any
      failure at its root cause, per AGENTS.md § Before finishing. Watch specifically for
      the unused-import lint error if `moduleOverviewPath` was left behind in step 2.1.
- [x] 6.4 Load the real lesson page in the browser and confirm the reported bug is gone:
      clicking "Advanced Vowel Pronunciation In American English" expands it in place
      instead of routing to `/en/courses/advanced-intermediate-course/modules/2-advanced-vowel-pronunciation-in-american-english`.
