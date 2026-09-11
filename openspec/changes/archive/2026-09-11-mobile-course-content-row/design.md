## Context

`OutlineDrawer` currently dispatches its mobile branch four ways: the original `<details>`
baseline, plus variants A, B and C selected by `?outline=`. The learner compared all three on
an iPhone and chose **B**, the compact row. Everything else in that fan-out is now cost.

What exists after the provisional change:

| Path | Disposition |
| --- | --- |
| `outline-variant-a/`, `outline-variant-c/` | delete |
| `outline-variant-b/` | becomes the mobile drawer |
| `outline-variant/outline-variant.ts` (the shared contract) | delete |
| `outline-variant/outline-variant-fixture.ts` | move, keep |
| `outline-drawer.tsx`'s `OUTLINE_VARIANT` / `MobileOutline` / `DefaultOutlineDrawer` | delete |
| `use-course-watch-progress/`, `lib/lesson-position/` | keep as-is |

The constraints that shaped the row still hold and are not re-litigated here: one completion
rule (`countsAsComplete`), no meter fill before hydration, `next-intl` for every number and
label, and the `Outline` untouched.

## Goals / Non-Goals

**Goals:**

- One mobile presentation, specified rather than implied.
- No trace of the comparison in the shipping code — no "variant", no switch, no dead branch.
- A net deletion. The change should remove more than it adds.
- The two derivations the row depends on survive intact, with their tests.

**Non-Goals:**

- Redesigning the row, or tuning it. It ships as judged.
- Touching the desktop sidebar or the `Outline`.
- Removing `nuqs` from the project.

## Decisions

### D1 — The row moves *into* `outline-drawer.tsx`, it does not become a component folder

`OutlineDrawer` has always been "the responsive shell that owns both branches", with the
mobile `<details>` written inline beside the desktop `<aside>`. The variants pushed the mobile
branch out to its own folder only because there were three of them to hold apart. With one,
that reason is gone, and the file returns to the shape it had before — both branches visible
side by side, which is the thing a reader of a responsive shell wants to see.

So: no `course-content-row/` folder, no `outline-drawer-row/`. The row is a
`MobileOutlineDrawer` function in `outline-drawer.tsx`, below the exported shell, per the
stepdown rule.

*Alternative considered — keep it as its own folder under a non-variant name.* It would satisfy
folder-per-entity more literally, but folder-per-entity exists for things "exported and
meaningful on its own". This one is neither: it has exactly one caller, forever, and exporting
it would invite a second.

*Cost, stated plainly:* `outline-drawer.tsx` grows to 263 lines. Acceptable because every
function in it stays short and single-purpose, and the alternative fragments one responsive
decision across two directories. Worth revisiting if a third concern lands in the file.

### D2 — The fixture moves to `outline-drawer/`, keeping its test-and-story double duty

`makeCourseFixture`, `seedCompletedLessons` and `clearWatchProgress` are used by the row's
tests *and* its stories, and both move into `outline-drawer/`. The file is renamed to
`outline-drawer-fixture.ts` and its `OutlineVariantProps` import becomes the drawer's own
props, so nothing named "variant" survives the move.

`makeCourseFixture` loses the `headline` it used to build: the drawer now derives that itself
from `modules` + `lessonsByModuleId`, which is the code path production takes, so the tests
exercise the derivation instead of hand-feeding around it.

### D3 — `outline-drawer.test.tsx` drops its echo-the-key `next-intl` mock

The existing file mocks `next-intl` so `t("title")` returns `"title"`, and asserts on that.
That was tolerable while the drawer's only copy was one label. The row states
`Consonants · Lesson 13 of 27` — an ICU message with three interpolated values — and asserting
`"positionLabel"` would prove only that a key was passed somewhere.

So the file switches to the real `NextIntlClientProvider` with the real `en.json`, following
`src/components/module-watch-progress/module-watch-progress.test.tsx`. The four pre-existing
assertions on `"title"` become assertions on `"Course outline"`, which is what a learner reads.

This is a change to tests that were passing, so it is done as one move with the suite green on
either side of it, not folded into the row's own edits.

### D4 — The e2e spec is rewritten around the drawer, not deleted

Four of its seven tests were about the switch and go with it. What survives is worth keeping
and is re-pointed at the drawer: the row renders on a phone, it expands onto the current
lesson, and — the one only a browser can answer — the desktop sidebar is what renders at
desktop width instead.

One test is **added**: a URL carrying `?outline=c` renders the row. That is the spec's
"leftover switch parameter changes nothing" scenario, and it is the only guard that a
half-removed dispatch would trip.

The file is renamed `e2e/lesson-outline-drawer.spec.ts`; a spec named for variants that no
longer exist is a comment that has drifted from its code.

### D5 — Four message keys are deleted, the two the row uses stay

`progressLabel` and `viewContent` were A's; `dockedCounter` and `dockedAriaLabel` were C's.
All four go, from all three locales. `title`, `positionLabel` and `completionAriaLabel` stay.

Deleting them is the point rather than a tidy-up: a message file is what translators work
from, and leaving four keys nothing renders sends them work that will never be seen.

### D6 — The provisional change is archived with `--skip-specs`

`mobile-course-content-variants` was written as a disposable capability, and archiving it
normally would fold requirements about a three-way switch into `openspec/specs/` moments before
this change removes them. `openspec archive mobile-course-content-variants --skip-specs`
records that the change happened and moves it to `openspec/changes/archive/`, leaving its
proposal and design readable as *why the row was chosen* without asserting its requirements as
current truth.

Order matters: archive first, then this change's own deltas apply against a `openspec/specs/`
that never held the switch.

## Risks / Trade-offs

- **A half-finished deletion leaves a broken import.** → `pnpm verify` fails on the first
  dangling reference; typecheck is the guard and it is not skippable.
- **`outline-drawer.test.tsx` loses its mock and its four old assertions change meaning.** →
  D3 makes that its own step with the suite green before and after, so a failure there is
  attributable to the mock swap rather than to the row.
- **Someone has a `?outline=b` URL open.** → It renders the row, which is what they were
  looking at. `?outline=a` or `?outline=c` renders the row too, which is a change for them —
  and the one the spec scenario pins.
- **The archived comparison becomes the only record of A and C.** → Intended. That is what the
  archive is for, and the proposal names where to find it.
- **Deleting the shared contract removes the thing that kept the three honest.** → With one
  presentation there is nothing to keep honest; the contract's job ended with the comparison.

## Testing strategy

**Deleted with their subjects** — `outline-variant-a/*.test.tsx`, `outline-variant-c/*.test.tsx`
and their stories. Their coverage is not migrated: it described components that no longer exist.

**Vitest + RTL (`outline-drawer.test.tsx`)** — absorbs `outline-variant-b.test.tsx` wholesale
and keeps the drawer's own four tests, re-pointed at real copy per D3. The merged file covers:
the row names the region and states `Consonants · Lesson 13 of 27`; it is collapsed on arrival;
the tile and chevron are not separately focusable and the card holds exactly one control;
activating it expands onto the current lesson; the chevron stays `aria-hidden` while
`aria-expanded` carries the state; the region is not named twice; the edge meter's fill and
progress role wait for hydration and for a non-zero reading; the desktop `<aside>` is
unchanged. `useIsHydrated` is mocked behind a module-scoped flag, as
`theme-toggle.test.tsx` does.

One test crosses the meter and the marks deliberately: it expands the row and asserts the
count of `lesson-completion-mark` elements against the meter's `aria-valuenow`. Nothing else
in the suite would catch a meter that grew arithmetic of its own instead of deferring to
`countsAsComplete`, and the guard was confirmed to fail against a mutated fraction before
being kept.

**Vitest + RTL (`lesson-view.test.tsx`)** — the `withNuqsTestingAdapter` wrapper added for the
switch is removed along with the switch, returning those ten renders to plain `render`.

**Unchanged and expected to stay green** — `use-course-watch-progress.test.ts` and
`lesson-position.test.ts`. If either needs an edit, something was removed that should not have
been.

**Storybook** — `outline-drawer.stories.tsx` absorbs the row's four progress states (collapsed,
expanded, no-progress, course-complete) alongside its existing Desktop / Mobile / LongCourse
stories; `outline-variant-*.stories.tsx` are deleted.

**Playwright e2e** — `e2e/lesson-outline-drawer.spec.ts` per D4.

**Manual** — a look at the row on the phone after the move, to confirm the promotion did not
change what was approved. Not a new comparison; a check that nothing moved.
