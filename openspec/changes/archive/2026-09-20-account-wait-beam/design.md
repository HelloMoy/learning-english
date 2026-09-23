## Context

Five surfaces send an account request and then wait: `SignInForm`, `SignUpForm`,
`ForgotPasswordForm`, `ResetPasswordForm` and `DeleteAccountSection`. The first four share
`useAccountSubmission` and `AccountSubmitArea`, so the only thing that marks the wait is
`AccountSubmitArea` swapping the button's label. The fifth does not share either: it keeps its own
`DeletionStatus` state machine (`idle` / `sending` / `sent` / `error`) and hand-rolls the same
label swap on a bare destructive `Button`.

So the wait is already implemented twice, both times as the weakest possible signal — static text
on a static page. There is no motion anywhere, and on sign-in the signal stops before the wait
does: `authClient.signIn.email` resolving is roughly the halfway point, and the slower half is the
navigation to `returnPath` where the learner's progress is read.

The treatment being built was chosen by the user from an explored set of five, as the combination
of two of them: «Botón en vuelo» (the submit button turns an arc and dims the form behind it) and
«Haz de proyector» (an indeterminate gold bar sweeps the top edge of the card, with a line of copy
naming the wait). A third option, «Anillo por pasos», was built first and withdrawn before it was
committed; nothing of it survives in the tree.

The surrounding constraints are already in place and this design does not move any of them: the
Immersion Cinema tokens (`--gold`, `--amber`, `--glow`) are defined for both themes in
`globals.css`, a global `prefers-reduced-motion` block stills every animation in the app, and all
copy goes through `next-intl` in `en`, `es` and `pt`.

## Goals / Non-Goals

**Goals:**

- One wait, implemented once, that all five surfaces show — including the deletion section, which
  today is the odd one out.
- Motion that reads as "still happening" without claiming how far along it is.
- The form stays on screen. A quick response must not produce a flash of layout, and a refusal
  must return the learner to their own typing untouched.
- Exactly one announcement per waiting screen, and a screen that still reads correctly with every
  animation stilled.
- No new dependency, no domain or adapter code, no new state management.

**Non-Goals:**

- Measuring anything. No percentage, no stage count, no estimate — see the proposal's "No stage is
  named or counted".
- The brand wordmark's flickering dot from the artifact mock, `GoogleSignInButton`, any route's
  `loading.tsx`, and the three unbuilt treatments. All are listed as non-goals in the proposal.
- Unifying the deletion flow's *error handling* with `useAccountSubmission`. Only the waiting is
  homologated — see D7.

## Decisions

### D1 — Two treatments, two jobs, not two spinners

The artifact's own note on «Haz de proyector» warns: *"Dos movimientos a la vez; conviene uno solo
si el botón ya gira."* That warning is about two indicators competing for the same job. They are
kept because they are given different jobs:

- The **arc** is bound to the control. It answers "did my press register?" — it lives on the thing
  that was pressed, and it is the only part that appears for a response that arrives in under a
  few hundred milliseconds.
- The **beam** is bound to the surface. It answers "is the page still alive?" — it spans the card,
  above the heading, where the eye goes when the button stops being interesting.

They are visually separated (opposite ends of the card), they differ in shape and rhythm (a 720ms
rotation against a 1400ms sweep), and neither restates the other. The status line sits with
the button and names the wait in words, which is the part that survives reduced motion.

**Alternative considered — arc only.** The artifact's «Botón en vuelo» entry rates its own risk as
*"se queda corta si la espera pasa del segundo"*, and the Turnstile-backed requests routinely do.
Rejected.

**Alternative considered — beam only.** Leaves the pressed control unacknowledged, which is the
failure that produces double submissions. Rejected.

### D2 — The form stays; it is dimmed and `inert`, not unmounted

The withdrawn «Anillo por pasos» replaced the form body. This one does not, and the difference is
deliberate: unmounting the fields throws away the learner's typing on the React side and forces the
refusal path to restore it, and it guarantees a layout jump on every fast response. Keeping the
form mounted means a refusal is a no-op on the DOM — the dimming lifts and the error appears.

The paused region uses the `inert` attribute rather than a bundle of `disabled` + `aria-hidden` +
`pointer-events-none`:

- `inert` blocks pointer events, focus (including tabbing in) and text selection in one attribute,
  and removes the subtree from the accessibility tree — which is exactly the four things wanted.
- `disabled` on each field would fight `AccountField`'s own disabled styling and would not stop a
  `Link` (sign-in's "forgot password" link sits among the fields).
- `aria-hidden` alone leaves the subtree focusable, which is the one combination the ARIA spec
  calls out as broken.

`inert` is a first-class boolean prop in React 19, which this project is on.

**Consequence for the submit button:** it sits *outside* `AccountWait.Paused`, at full opacity, so
the arc is visible and the button can be the thing that holds the disabled state. This matches the
artifact's mock, where `.paused` covers only the fields. `Button`'s own `disabled:opacity-50` had
to be overridden for the pending case: a button that cannot be pressed *yet* is dimmed, a button
that is *working* stays legible, and collapsing the two faded the arc out exactly when it was the
only thing to read. The browser review at task 4.2 is what caught it.

**The Turnstile challenge pauses too.** It lives in `AccountSubmitArea`, outside the form's own
paused region, and a solved challenge is a bright green tick — once the fields dim it becomes the
loudest thing on the card after the button, and the learner can no longer act on it. It is
therefore wrapped in a nested `AccountWait.Paused`, which needs no extra wiring because the parts
read `busy` from context. The browser review at task 8.3 is what caught it.

### D3 — Three components, split by what each one is

Rather than one `AccountWait` that does everything:

| Component | Owns | Used by |
| --- | --- | --- |
| `SpinnerArc` | The turning gold arc, and nothing else | `PendingButton` |
| `PendingButton` | A `Button` that swaps its label and shows the arc while pending | `AccountSubmitArea`, `DeleteAccountSection` |
| `AccountWait` (+ `.Paused`, `.Status`) | The beam, the paused region, the one live region | All five surfaces |

`PendingButton` exists because of D7: it is the seam that lets the deletion section wait like the
other four without adopting their submission hook. `SpinnerArc` is split out from it because the
arc is a shape with no opinion about buttons, and it is the piece a story needs to show on its own.

**`AccountWait` is a compound component**, not a single component with node props. The five
surfaces differ in which parts they need — the four forms have a paused region, the deletion
section has no fields to pause — and the parts land at different depths in each caller's JSX. A
single component would need a `paused` node prop *and* a `status` string prop *and* `children` for
the live part, which is three slots pretending to be one element. The compound form reads as what
it is:

```tsx
<AccountWait busy={isWaiting}>
  <AccountWait.Paused>{/* fields */}</AccountWait.Paused>
  <AccountSubmitArea … />
  <AccountWait.Status>{t("signIn.waiting")}</AccountWait.Status>
</AccountWait>
```

`busy` travels from the root to the parts through React context, so no caller threads it three
times and no part can disagree with another about whether a wait is happening. This is the pattern
AGENTS.md names for JSX that mixes concerns.

### D4 — The beam positions itself; the card is only asked to be a positioning context

The beam is `absolute inset-x-0 top-0`, so it needs its nearest positioned ancestor to be the card
and needs that card to clip it. `AccountShell` gains `relative overflow-hidden` — two static
classes, no prop, no state, so it stays a server component and nothing about its API changes.
`DeleteAccountSection`'s own `<section>` gets the same two classes.

**Alternative considered — a `busy` prop on `AccountShell`.** The pending state lives in the form,
which is the shell's *child*; a prop would mean lifting client state above a server component or
turning the shell into a client component for every page that uses it. Rejected.

**Alternative considered — the beam inside `AccountWait`'s own relatively-positioned wrapper.**
Puts the beam at the top of the form rather than the top of the card, below the heading. That is
not the artifact's design, and it reads as a divider rather than as light crossing the surface.
Rejected.

### D5 — Exactly one `role="status"`, and what has to move aside for it

`AccountWait.Status` is the live region, and it is **mounted whether or not a request is in
flight** — empty at rest, filled while waiting. A live region inserted into the document together
with its text is not reliably announced; one that is already in the tree and then filled is. Being
`sr-only` at rest, it is out of flow, so an empty region contributes no gap to the card's layout.

It carries **the surface's own sentence**, not a shared one. The first draft of this design had a
fixed surface-neutral sentence in the live region and the specific sentence only in the visible
line, which meant a screen-reader user heard "working on it" where someone watching the screen read
"checking your details" — strictly less information, for no gain. The visible line is therefore
`aria-hidden` and renders the same string, so the wait is read once and says the same thing to
everyone. There is no `Components.AccountWait.label`; the copy is per surface (D9).

Two things already on these screens would otherwise make a second live region while a wait is in
flight:

1. **`SignInForm`'s `passwordUpdated` notice** (`role="status"`, shown after a reset). It sits
   among the content that goes into `AccountWait.Paused`, so `inert` takes it out of the
   accessibility tree for the duration of the wait, leaving one.
2. **`DeleteAccountSection`'s `sent` notice** (`role="status"`). It is only rendered in the `sent`
   state, which is terminal and mutually exclusive with `sending`. No overlap.

`AccountSubmitArea`'s error is `role="alert"`, not `status`, and is cleared at the start of every
attempt, so it never coexists with a wait either.

The arc, the beam and the visible status line are all `aria-hidden`. The live region is the only
thing that speaks, it says one sentence, and it does not change while the wait lasts — so a screen
reader announces the wait once rather than narrating it.

### D6 — Sign-in holds the wait past the response, with one boolean

`SignInForm` gets `const [isLeaving, setIsLeaving] = useState(false)`, set immediately before
`router.replace`. The wait is `submission.isPending || isLeaving`. Without it the form un-dims the
moment the credentials are accepted and re-dims — or worse, sits there looking idle — for the whole
navigation.

**The button has to follow the surface, not the request.** `AccountSubmitArea` drives its
`PendingButton` from `submission.isPending`, which goes false the moment the credentials resolve —
so during `isLeaving` the button dropped back to "Sign in" while the beam was still sweeping and
the fields were still dimmed. The submit area therefore also reads the surrounding wait, through
`useIsWaiting()` exported from `account-wait`, and is in flight when *either* says so. The hook
returns `false` outside an `AccountWait`, so the submit area still works on its own, and
`PendingButton` stays ignorant of all of it — it is told `isPending` and does not care who decided.

This does not survive the navigation itself, and cannot: the destination's `loading.tsx` is a
Suspense boundary the App Router mounts as soon as the route suspends, so it replaces the sign-in
page whatever the navigation is wrapped in, a `startTransition` included. The two are a sequence,
and the handover is the intended behaviour, not a gap. No other surface needs this flag: the other
four end their wait on the same page.

### D7 — The deletion section is homologated at the button, not at the hook

The user asked for the deletion section to look like the others. There were two ways:

**Adopt `useAccountSubmission` and `AccountSubmitArea` wholesale.** Rejected. The section is not a
form: its button is `type="button"` and opens `DeleteAccountModal` before any request exists, it is
unchallenged so the Turnstile branch is dead weight, its errors are `Profile.deleteAccount.error`
rather than `Account.errors.*`, and it has a terminal `sent` state that `AccountSubmission` has no
concept of. Forcing it through would mean adding three escape hatches to a hook that four callers
currently use cleanly — paying in the shared abstraction for one caller's shape.

**Share the one thing they actually have in common — the button.** Taken. `PendingButton` is the
whole of "Botón en vuelo", so a caller that renders it gets the arc, the label swap and the
disabled-while-pending behaviour identically, whatever drives its `isPending`. The deletion section
passes `status === "sending"`, keeps its own state machine, its own copy and its own terminal
state, and wraps itself in `AccountWait` for the beam and the status line like everyone else.

The result is homologous where the learner looks — same arc, same beam, same status line, same
rhythm — without a false abstraction underneath.

### D8 — Keyframes in `globals.css`, following the convention already there

The sweep and the spin go in `globals.css` as `@keyframes` plus an `.account-wait-beam` /
`.spinner-arc` class, next to the guide, prize and achievement animations, each with the comment
explaining why it exists.

**The sweep is linear, and stops travelling the moment it leaves the card.** The first cut copied
the artifact's `cubic-bezier(0.65, 0, 0.35, 1)` over a `-100%` → `340%` travel, and that is wrong
twice over. An ease-in-out dwells at both ends of its travel, and both ends of this travel are
off-canvas; and `340%` keeps moving for a full light-width after the light has already cleared the
right edge, which for a light 42% of the rail happens at `238%` (100 / 0.42). Between them they
left the beam invisible for most of each cycle — sampled from the running app it showed light in
4 frames out of 10, reading as two flashes at the edges rather than as a sweep. Linear over
`-100%` → `238%` keeps the light on the card for the whole cycle. The rail behind it also went
from 16% to 26% gold, so the path the light runs along is legible when the light is at the far
end. They are also added to the trailing
`@media (prefers-reduced-motion: reduce)` list that sets `animation: none` on the named classes —
belt and braces over the global block, matching what the existing animations do.

Not Tailwind arbitrary-value animations: a multi-stop sweep with a gradient pseudo-element does not
express in a utility class, and the reduced-motion list is the project's established place to
register a named animation.

**Note for implementation** — `Turbopack serves a stale `globals.css`; after editing it,
`rm -rf .next` and restart the dev server, or the beam will appear unstyled while the JSX
hot-reloads around it.

### D9 — Copy

New keys, all three locales, no locale left untranslated:

- `Account.signIn.waiting`, `Account.signUp.waiting`, `Account.forgotPassword.waiting`,
  `Account.resetPassword.waiting` — each form's sentence, alongside its existing `submitting`.
- `Profile.deleteAccount.waiting` — the deletion section's sentence, alongside its existing
  `sending`.

One key per surface, and no shared one: each surface's sentence feeds both its live region and its
visible line (D5), so "Checking your details…" and "Sending your confirmation email…" are written
once each and read the same way by everyone.

`AccountWait` itself calls no `useTranslations`. The sentence arrives as children from the caller,
which already has the right namespace open — so the component stays locale-agnostic and the copy
lives with the surface that owns it.

## Testing strategy

Red → Green → Refactor on every task; the failing test is written first.

**Vitest + RTL, colocated (the bulk of it).** The wait is component behaviour and observable in
jsdom, so it is tested there rather than in Playwright, per the testing-stack table.

| File | Covers |
| --- | --- |
| `spinner-arc.test.tsx` | Renders, carries the animation class, exposes no accessible name. |
| `pending-button.test.tsx` | Idle shows `label` and no arc; pending shows `pendingLabel` and the arc and is disabled; `type`, `variant` and `onClick` pass through. |
| `account-wait.test.tsx` | Idle renders children with no beam, no dimming, no `inert`, no live region. Busy renders exactly one `role="status"` with the fixed copy, the beam `aria-hidden`, and `.Paused` carrying `inert`. Copy resolves in `en`, `es` and `pt` with `renderInLocale`, with no raw key and no English fallback. |
| `account-submit-area.test.tsx` (existing) | The button is now a `PendingButton` — the existing label-swap assertions must still pass, with an arc added while pending. |
| `sign-in-form.test.tsx` (existing) | Submitting dims and inerts the fields without unmounting them; the wait stays up after the credentials resolve, through `router.replace` / `router.refresh`, which are still called with today's arguments; a refusal lifts the wait with the typed values and the error intact. |
| `sign-up-form.test.tsx`, `forgot-password-form.test.tsx`, `reset-password-form.test.tsx` (existing) | Same three beats per form, ending in that form's own terminal state (confirmation, confirmation, navigation). |
| `delete-account-section.test.tsx` (existing) | Confirming the modal puts the section in the wait; the `sent` and `error` states are unchanged from today. |

Existing tests are the ones that catch a regression here, so they are read and extended rather than
replaced — the label-swap assertions already in `account-submit-area.test.tsx` and each form's test
are the contract this change must not break.

**A note on filling account forms in Playwright.** These pages are server-rendered and hydrate a
moment later, and filling a controlled input before React attaches its `onChange` puts the text in
the DOM but never in React state: the form submits empty, fails its own validation, and the field
clears itself on the next render. `e2e/learner-account.spec.ts` was already racing this — two of
its WebKit tests fail on `main` — and adding three client components to these pages widened the
window. The spec's `enter()` helper now waits for the hydration marker React puts on each host
node before typing, which fixed those pre-existing failures as well. Asserting the DOM value after
filling is *not* enough to catch this: the DOM is exactly where the lost text sits.

**Playwright e2e, `e2e/learner-account.spec.ts`.** One scenario, for the one thing jsdom cannot
observe: with the credentials request held back through the existing `learner-account-fixture.ts`,
the beam and the arc are actually painted, the fields cannot be focused or typed into, exactly one
`role="status"` is present, and the learner still lands on `/en/learning`. Run with `--workers=1`
against `PLAYWRIGHT_BASE_URL`, since port 3000 is taken on this machine.

**Storybook, colocated, reviewed in the browser with Playwright MCP.** `SpinnerArc`,
`PendingButton` (idle and pending) and `AccountWait` (idle and busy) each get stories under
`Components/`, reviewed in `en`, `es` and `pt` and in both themes — the beam's gold differs per
theme, and a status line that overflows its card only shows up rendered. No `next-intl` mock.

**Not tested:** that the animation visibly moves. `prefers-reduced-motion` is asserted through the
class list, not through a rendered frame; jsdom does not run animations and asserting on a
Playwright screenshot of a 1250ms loop is a flake generator.

## Risks / Trade-offs

- **Two moving things at once read as busy-ness rather than as one wait** — the artifact's own
  warning. → Mitigated by D1: different anchors, different rhythms, and a Storybook review of the
  busy state in both themes before the forms are wired (task order puts the stories before the
  wiring for this reason). If the review says it is noisy, the beam is the part that drops — it is
  one component and one class, and the arc is the part that cannot be removed.
- **`inert` browser support.** Baseline across current Chrome, Firefox, Safari and iOS Safari, but
  an older browser would leave the paused fields focusable. → The submit button is `disabled`
  independently of `inert`, so the worst case is a learner who can tab into a field they cannot
  submit — degraded, not broken.
- **A fast response makes the beam flash for ~150ms.** → Accepted rather than debounced: a delay
  before showing the indicator means a slow-but-not-slow-enough response shows nothing at all,
  which is today's bug. The arc and the beam both start and stop with the request, and the dimming
  transitions rather than snapping, which takes the edge off the flash.
- **`AccountShell` gains `overflow-hidden`,** which would clip any child that deliberately overflows
  the card. → Nothing in the four account pages does today; the change is a one-line revert if
  something later needs to.
- **The deletion section keeps its own state machine,** so a future change to how account requests
  fail has two places to touch. → Deliberate (D7), and the proposal and this document both say so
  outright; the alternative was three escape hatches in a shared hook.
