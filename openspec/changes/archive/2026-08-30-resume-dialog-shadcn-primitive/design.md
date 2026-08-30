## Context

`src/components/lesson-view/lesson-video-resume/lesson-video-resume.tsx` renders
the only modal in the app, and it is a fake one: a `<div role="dialog">` with
`aria-live="polite"`, two raw `<button>` elements, and inline Tailwind. It is
rendered as a sibling of `<NativeVideoPlayer>` inside the player's `relative`
wrapper and positioned with `absolute inset-x-4 top-4`. Nothing traps focus,
nothing handles `Escape`, there is no `aria-modal`, and the accessible name
comes from `aria-label` rather than a title element.

`AGENTS.md` §Modals already specifies the intended pattern — `@ebay/nice-modal-react`
for the imperative trigger, shadcn `<Dialog>` for the UI — and its code sample
imports `@/components/ui/dialog`. That module has never existed: `src/components/ui/`
contains only `button/`. `<NiceModal.Provider>` sits mounted in
`global-providers.tsx:13` with zero consumers. The convention is documented but
unbuildable, which is exactly why the resume prompt was hand-rolled.

Two constraints shape the work:

- **`radix-ui` unified package.** The project depends on `radix-ui@^1.6.0`, not
  the per-primitive `@radix-ui/react-*` packages. `button.tsx:4` already does
  `import { Slot } from "radix-ui"`. shadcn's current v4 registry source uses the
  same unified import for Dialog, so the canonical source drops in unmodified.
- **The current file mixes two responsibilities.** `isPositionResumable`,
  `MIN_SECONDS_FROM_START` and `SECONDS_NEAR_END` are pure domain-ish rules that
  `PlaybackPositionedVideoPlayer` imports from the *component* module. Once the
  component becomes a NiceModal-driven modal, the player must not import it at
  all, so the predicate has to move first.

The user has decided the resume prompt becomes a **true centered modal** with a
backdrop, not an anchored non-blocking card.

## Goals / Non-Goals

**Goals:**

- A real, reusable `Dialog` primitive at `src/components/ui/dialog/dialog.tsx`,
  faithful to shadcn's v4 registry source, restyled onto the project's tokens.
- The resume prompt rebuilt on that primitive as a NiceModal modal, with focus
  trap, `Escape`, backdrop dismissal, `DialogTitle` and `DialogDescription`.
- `<NiceModal.Provider>` becomes live with a real first consumer, so the
  `AGENTS.md` pattern is demonstrated by production code rather than by a doc.
- The resume decision rules stay byte-identical in behaviour and become
  independently unit-testable.

**Non-Goals:**

- Any other shadcn primitive (`Sheet`, `AlertDialog`, `Drawer`, `Popover`).
- Touching `OutlineDrawer`'s `<details>` accordion.
- Changing thresholds, debounce cadence, or the `localStorage` adapter.
- An animation/motion system beyond the `tw-animate-css` classes shadcn ships.

## Decisions

### D1 — Copy shadcn's v4 Dialog source verbatim, then restyle only the class strings

**Decision.** Take the registry source for `dialog.tsx` (structure, `data-slot`
attributes, prop signatures, `showCloseButton`) unchanged, and edit *only* the
Tailwind class strings to the project's tokens.

**Rationale.** The structure is the accessible contract; the classes are the
skin. Keeping the structure verbatim means a future `pnpm dlx shadcn@latest diff
dialog` produces a readable diff, and any shadcn doc or block that composes
Dialog works here without translation. `AGENTS.md:72` explicitly exempts
unmodified shadcn output from the clean-code skill — that exemption only holds
if we stay recognisably close to the source.

**Restyling, concretely:** `bg-background` → `bg-card` (the Immersion Cinema
panel surface, `--card: #16171d` dark / `#fffdf6` light), `border` →
`border-border`, `rounded-lg` → `rounded-xl` to match the `rounded-2xl`/`rounded-xl`
panels in `OutlineDrawer`, and the overlay `bg-black/50` → `bg-black/70` so the
backdrop actually reads over a playing video frame. Focus rings use the existing
`focus-visible:ring-3 focus-visible:ring-ring/50` idiom from `buttonVariants`.

**Alternative rejected — write a minimal bespoke Dialog.** Fewer lines, but it
re-earns every a11y bug Radix already solved (scroll lock, focus restore,
aria-hidden on siblings, pointer-events on the backdrop) and breaks the
"shadcn/ui" claim in `AGENTS.md:103`.

### D1b — Modality is asserted via `aria-hidden` on the background, not `aria-modal`

**Decision.** Tests and specs assert that everything outside the dialog content
carries `aria-hidden="true"` while it is open. They do **not** assert
`aria-modal="true"`.

**Rationale.** Discovered while writing `dialog.test.tsx`: Radix's
`Dialog.Content` emits `role`, `aria-labelledby`, `aria-describedby`,
`data-state` and `tabindex`, but no `aria-modal`. That is deliberate on Radix's
part — it uses the `aria-hidden`-the-rest technique instead, which is the more
robust of the two. `aria-modal` is unevenly implemented, and where it is
honoured it has historically hidden *the dialog's own* content from some screen
readers. Verified in jsdom: with a dialog open, every sibling of the content —
overlay included — is `aria-hidden="true"`, and only the content is not.

Asserting `aria-modal` would have meant either a false requirement or patching
the attribute onto shadcn's source, which D1 forbids.

### D2 — `Escape` / backdrop / close ⇒ "restart", not "no decision"

**Decision.** The modal resolves a three-valued result. `NiceModal.show()`
returns `{ action: "resume", seconds }`, `{ action: "restart" }`, or
`{ action: "dismissed" }`, and the player treats `dismissed` exactly like
`restart` — leave `currentTime` at `0`.

**Rationale.** A modal that traps focus must be escapable, and every exit path
has to leave the player in a defined state. "Start from the beginning" is the
safe default: the stored position is untouched, so if the learner reloads they
get the offer again. Silently seeking to the stored position on dismissal would
be the opposite of what dismissing means.

The player still distinguishes `dismissed` from `restart` in the resolved value
even though it acts the same on both — the distinction costs nothing and keeps
the modal's contract honest for future callers.

**Alternative rejected — `modal.resolve()` with no value on dismissal.**
NiceModal resolves `undefined` when hidden without an explicit `resolve`, which
forces the caller into an `if (result === undefined)` branch that reads like a
bug. An explicit `"dismissed"` variant is self-documenting.

### D3 — Open once per mount, guarded by a ref

**Decision.** The player fires `NiceModal.show()` from the existing mount effect
that reads the stored position, behind a `hasOfferedResumeRef` guard. It is never
re-opened for the life of the mount.

**Rationale.** The mount effect already depends on `[position, durationSeconds]`;
in React 19 Strict Mode it runs twice in dev, and `durationSeconds` could in
principle change identity. Without a guard the learner would get a second dialog
on top of the first. A ref, not state — same reasoning as the existing
`hasInteractedRef` comment at `playback-positioned-video-player.tsx:53`: nothing
renders from it and the effect must observe the flip immediately.

### D4 — Extract the threshold predicate to `src/lib/playback-resume-thresholds/`

**Decision.** `isPositionResumable`, `MIN_SECONDS_FROM_START` and
`SECONDS_NEAR_END` move to
`src/lib/playback-resume-thresholds/playback-resume-thresholds.ts`, keeping the
existing JSDoc (including the `design.md §D4` reference to the original
`2026-07-26-lesson-playback-resume` change).

**Rationale.** The player needs the predicate; it must not import a modal
component to get it. `src/lib/**` is watched by the `local-structure/folder-per-entity`
ESLint rule, so the folder-per-entity layout is enforced, not merely conventional.

**Alternative rejected — `src/domain/`.** The thresholds are a presentation
policy ("when is it worth *offering* a resume"), not a domain invariant. The
domain already owns range and finiteness through the `PlaybackPosition` value
object; duplicating presentation rules there would blur the hexagon boundary
that `architecture-boundaries` enforces.

### D5 — Rename the i18n namespace, don't alias it

**Decision.** `Components.LessonVideoResume` becomes
`Components.LessonVideoResumeModal` in all three locale files, gaining
`description` and losing nothing. A new `Components.Dialog.closeLabel` covers
the primitive's `sr-only` close text.

**Rationale.** `AGENTS.md:562` fixes the namespace as `Components.<ComponentName>`.
The exported component is renamed, so the namespace follows. Keeping the old key
as an alias would leave a name that matches no component — precisely the drift
the convention exists to prevent.

The existing copy is reused verbatim (`dialogLabel` → the `DialogTitle`,
`resumeFrom` → the body, `resumeCta` / `restartCta` → the buttons); only
`description` is genuinely new, and it must be written for all of `en`, `es`,
`pt` in the same pass — `AGENTS.md` forbids leaving a locale untranslated.

### D6 — The player's test file wraps in `NiceModal.Provider`

**Decision.** `playback-positioned-video-player.test.tsx` renders inside
`<NiceModal.Provider>` and asserts against `screen` (the document), not the
container. The modal's own behaviour is tested in the modal's file.

**Rationale.** Portalled content is not in `render()`'s container. Existing
assertions that reach for the prompt inside the player's subtree will fail, and
that failure is the correct signal — it is the same reason the e2e specs already
query `page.getByRole("dialog", …)` at page scope and keep working unchanged.

## Testing strategy

| Behaviour | Layer | Mirrors |
| --- | --- | --- |
| `isPositionResumable` thresholds: `null`, `< 30s`, within last `10s`, mid-lesson, non-finite, `durationSeconds <= 0` | **Vitest unit** — `src/lib/playback-resume-thresholds/playback-resume-thresholds.test.ts` | the threshold cases currently embedded in `lesson-video-resume.test.tsx` ("GIVEN a position that does NOT pass the thresholds"), lifted out and asserted directly on the predicate — no `render` |
| Dialog primitive: exports resolve; open content is portalled outside the caller's container; `role="dialog"`, named by `DialogTitle`, described by `DialogDescription`; background marked `aria-hidden` (design §D1b); `Escape` fires `onOpenChange(false)`; overlay click fires `onOpenChange(false)`; `showCloseButton={false}` suppresses the button; close button's name comes from `Components.Dialog.closeLabel` | **Vitest component + RTL** — `src/components/ui/dialog/dialog.test.tsx` | `src/components/ui/button/button.test.tsx` for the primitive-level shape; `userEvent.keyboard("{Escape}")` for the key press |
| Resume modal: renders title/description/two CTAs; MM:SS formatting (`180 → 03:00`, `65 → 01:05`, `45 → 00:45`, faker fuzz); Resume resolves `{action:"resume", seconds}`; Restart resolves `{action:"restart"}`; hide resolves `{action:"dismissed"}`; `modal.remove()` runs after close | **Vitest component + RTL** — `src/components/modals/lesson-video-resume-modal/lesson-video-resume-modal.test.tsx` | `lesson-video-resume.test.tsx` wholesale — same `vi.mock("next-intl")` key-echo helper, same GIVEN/WHEN/THEN describe nesting, same faker usage — with the render wrapped in `NiceModal.Provider` and driven by `NiceModal.show` |
| Player: opens the modal only when the predicate passes; never opens for `null` / trivial / near-end; opens at most once per mount; `resume` seeks to the saved seconds; `restart` and `dismissed` leave `currentTime` at `0`; the debounced-write cadence is unaffected | **Vitest component + RTL** — `playback-positioned-video-player.test.tsx` (modified) | its own existing suite, rewrapped in `NiceModal.Provider` per D6 |
| Full cycle in a browser: seek → pause → reload → dialog with `00:30` → click Resume → `<video>` seeks | **Playwright e2e** — `e2e/lesson-playback-resume.spec.ts` (unchanged assertions) | already queries `page.getByRole("dialog", { name: /resume playback/i })` at page scope, so the portal move needs no edit; add one case for `Escape` leaving `currentTime` at `0` |
| Visual + a11y review in `en` / `es` / `pt`, light and dark | **Storybook** — `dialog.stories.tsx` (`UI/Dialog`) and `lesson-video-resume-modal.stories.tsx` (`Components/LessonVideoResumeModal`) | `button.stories.tsx`; the modal stories must wrap in `NiceModal.Provider` and must **not** mock `next-intl` (`AGENTS.md` rule) |

Order is TDD throughout: predicate unit tests → primitive → modal → player →
e2e. `pnpm verify` (typecheck, format, lint, `test:run`) plus `pnpm test:e2e`
for the lesson-playback-resume spec close the change.

## Risks / Trade-offs

- **The UX genuinely changes.** A learner returning to a lesson now gets a
  blocking, focus-trapping dialog instead of a card they could ignore. → This
  was chosen deliberately over the non-blocking alternative. D2 keeps the cost
  low: `Escape` is one keystroke and the dialog never returns for that visit.

- **`aria-modal` is absent by design.** An auditor grepping for `aria-modal`
  will not find it and may report the dialog as non-modal. → D1b records why,
  and the spec's scenario pins the `aria-hidden` mechanism so the intent is
  testable rather than folklore.

- **Portalled content breaks container-scoped queries.** Any assertion using
  `render(...).container` or `within(player)` for the prompt will fail. → D6
  makes this an explicit, expected step in the task list rather than a surprise;
  the e2e specs already query at page scope and are unaffected.

- **Autoplay/focus interaction.** Radix moves focus into the dialog on open. If
  a browser autoplays the video behind the backdrop, the learner hears audio they
  cannot pause without dismissing first. → `NativeVideoPlayer` does not set
  `autoPlay`; the video is paused on mount. No mitigation needed today, but a
  future autoplay change must revisit this.

- **Renaming the i18n namespace is a breaking key change.** A missed reference
  renders a raw key. → The namespace appears in exactly four places (three
  locale files and the component); `pnpm verify` plus the Storybook locale
  toolbar in `en`/`es`/`pt` catch a miss immediately.

- **Deleting `lesson-video-resume/` loses its git-visible history at that path.**
  → Acceptable: the tests and JSDoc move with the code, and the original
  rationale stays reachable through
  `openspec/changes/archive/2026-07-26-lesson-playback-resume/`.

## Migration Plan

Single atomic change on a feature branch; no data migration, no feature flag —
the modal replaces the overlay in one commit series. Rollback is a branch
revert. The `localStorage` keys, the port contract, and the adapter are all
untouched, so a revert cannot strand stored positions.

## Open Questions

None blocking. Two deferred:

- Whether the resume dialog should offer a "don't ask again for this lesson"
  affordance — deferred until there is usage evidence that the modal is
  intrusive.
- Whether `Components.Dialog.closeLabel` should later generalise to a shared
  `Common.close` namespace once a second primitive needs it. Kept
  component-scoped now, per the `Components.<ComponentName>` rule.
