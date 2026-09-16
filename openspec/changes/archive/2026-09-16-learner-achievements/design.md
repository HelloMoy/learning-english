## Context

Completion lives on the device: `useCompletedLessons` reads the `learning-english:completed:*` keys and
`useSavedPlaybackPositions` reads saved positions, and `countsAsComplete` combines them so every
progress surface agrees. The catalog reaches client pages as `HomeLevel` (course, modules and one
`LessonProgressSlice` per lesson). The lesson page's `LessonView` receives the whole course's modules and
lessons. Two producers mark a lesson complete — `LessonCompletionToggle` and `useCompleteWhenWatched` —
and both call `celebrateLessonCompletion` for confetti.

Earlier iterations of this change shipped a seal per lesson, a badge per module, an Achievements route,
a how-it-works dialog and motion. Design review replaced the reward language: seals and badges were both
gold circles and read as the same thing. The approved canvas ("Tickets y premios") uses arcade
redemption tickets per lesson, a different toy prize per module shown as a silhouette until redeemed, a
shelf-style prize counter (direction A), a curtain dialog for redeeming, and a pill notification for a
ticket.

## Goals / Non-Goals

**Goals:**

- One ubiquitous language: Ticket, Prize, Distinction — in code, copy, specs and `GLOSSARY.md`.
- Derive tickets, prize states and the distinction from completion; store only the learner's claim.
- Celebrate the two moments on the lesson page, exactly once per completion, from either producer.
- Keep the derivation pure and testable apart from React and storage.

**Non-Goals:**

- Special achievements, streaks, stored rewards, cross-device sync (see the proposal).
- Changing how completion is recorded or how the two producers work.

## Decisions

### D1 — Two stored facts, everything else derived

Earning a ticket and claiming a prize are things the learner did; prize states, counts and the
distinction are consequences. So the two acts are stored (D12) and everything else is computed from them
and the catalog on every render.

A ticket also reads as earned while its lesson counts as complete, even with nothing stored, so a device
that completed lessons before this shipped shows the tickets it deserves.

- *Alternative:* store earned rewards with timestamps. Duplicates completion, needs migration, and
  disagrees with the lesson rows after an un-mark.

### D2 — A pure derivation in `src/lib/learner-achievements/`

`learnerAchievements({ levels, isEarned })` returns, per course, its modules with their tickets
(symbol, title, earned), prize (`PrizeId`) and prize state (`redeemed` / `collecting` / `locked`), plus
`ticketsEarned`, `ticketCount`, `prizesRedeemed`, `prizeCount` and the distinction. `ticketSymbol` is
exported alongside. The seal/badge names and the badge emblem are removed: the prize is what a module
shows.

`useLearnerAchievements(levels)` builds `isEarned` from `useCompletedLessons`,
`useSavedPlaybackPositions` and `countsAsComplete`, exactly as `useCourseWatchProgress` does.

### D3 — The prize catalog is a lookup by module slug in `src/lib/module-prizes/`

`prizeForModule(slug): PrizeId` maps the fifteen known slugs to their prize and everything else to
`gift`. Slugs, not ids, because slugs are human-readable in review and stable in the content manifest;
the table lives in code, not content, because the prize is a product decision rather than course data.
Prize names are messages under `Components.PrizeIcon.names.<prizeId>`.

- *Alternative:* a `prize` field in the course content JSON. Content is generated from the lesson
  folders and would have to be regenerated to change a toy.

### D4 — `PrizeIcon` draws each toy as one inline SVG, in colour or silhouette

`PrizeIcon({ prize, locked, size })` renders one `<svg>` per prize (sixteen, including the gift box),
using three fills — main, detail, light — that collapse to a single silhouette colour when locked. It is
decorative (`aria-hidden`); callers say what it means in text. Silhouette colour is a new
`--prize-silhouette` token chosen for at least 3:1 against the card surfaces.

### D5 — The Achievements page is its own personal route

`/[locale]/achievements` resolves the catalog on the server and renders `AchievementsView`: shell until
storage answers, redirect to `/start` without a profile, then the learner card with its distinction, the
heading, **How do they work?**, the counts and the `PrizeCounter`. The avatar menu gains Achievements and
`sectionKey` learns the route. The Profile is unchanged.

### D6 — `PrizeCounter` is shelves of prizes, replacing the badge grid

One shelf per course: a glass-toned panel over a wooden plank, holding every module's prize in a
wrapping grid of up to five per row. Each item is `PrizeShelfItem`: the `PrizeIcon`, the name (or `???`
visually, hidden from assistive technology), and a ticket-shaped tag (`12 / 17` or `Redeemed`). The item's
accessible name carries the whole state in words. Tickets are no longer listed per module on the page;
the tag carries the count.

- *Alternative:* keep a per-module disclosure of tickets. The counter is about prizes; the lesson page
  is where tickets are earned and seen.

### D7 — `LessonTicket` replaces the seal

A cream (`--ticket` token) arcade ticket with notched ends carrying the lesson's symbol; used in the
ticket notification and in the how-it-works dialog. Gold stays reserved for prizes.

### D8 — Reward moments are observed on the lesson page, not pushed by the producers

`useLessonRewardMoment({ lesson, moduleLessons })` in `src/hooks/use-lesson-reward-moment/` watches
whether the current lesson counts as complete. It remembers the value from the first render after
hydration and fires only on a `false → true` transition while mounted:

Every transition returns a ticket moment (`{ symbol, earned, total, prize }`) that `LessonView` renders
as `TicketToast`, cleared after five seconds. When the transition also collects the module's last
ticket, the moment carries that fact and the hook opens `PrizeReadyModal` as the toast leaves (D13).

Both producers already converge on the completion store, so observing it covers both without touching
them and cannot double-fire. Confetti stays where it is.

- *Alternative:* call a new announcer next to `celebrateLessonCompletion` in both producers. Two call
  sites to keep in step, and the producers do not know the module's other lessons.

### D9 — `TicketToast`, `PrizeReadyModal` and `PrizeRedeemedModal`

`TicketToast` is a fixed pill at the top centre at every width, `role="status"`, pointer-transparent
except itself, with the ticket slot, the copy and the prize silhouette. The top is where the learner is
looking after pressing a control in the rail, and it keeps the pill off the player's own chrome.

Both modals follow the `ui-dialog-primitive` contract (NiceModal + Dialog, returns focus to the opener
recorded on first render, as `AchievementsGuideModal` does). `PrizeReadyModal` shows the silhouette only,
with **Go and claim the prize** (a link to `/achievements`) and **Keep learning**. `PrizeRedeemedModal`
keeps the reveal and loses its navigation: shown from the counter, **See my prizes** would point at the
page the learner is already on, so one closing control remains.

### D10 — Motion stays CSS keyframes plus `useCountUp`

New keyframes join the `achievement-*` set in `globals.css`: `ticket-dispense`, `ticket-toast`
(rise → widen → hold → collapse), `prize-sway`, `prize-glow`, and the redeem sequence (`redeem-feed`,
`redeem-shake`, `redeem-flash`, `redeem-reveal`). All end on the resting style; one reduced-motion block
switches them off. The toast's lifetime is a timer in React, not the animation, so reduced motion still
leaves after five seconds.

### D12 — Earned tickets and claims are stored beside the other device facts

Two stores, both shaped like `useCompletedLessons` (a module-level snapshot through
`useSyncExternalStore`, refreshed by the `storage` event and by their own writer):

- `src/hooks/use-earned-tickets/` keeps `learning-english:ticket-earned:<lessonId>` and exposes
  `useEarnedTickets()` and `earnTickets(lessonIds)`, which writes only the ids it does not already hold
  and stays silent when there is nothing new, so a caller can hand it the whole catalog on every render
  without looping.
- `src/hooks/use-prize-claims/` keeps `learning-english:prize-claimed:<moduleSlug>` and exposes
  `useClaimedPrizes()` and `claimPrize(slug)`. Slugs, not module ids, for the reason the prize catalog
  uses them (D3): stable, readable in devtools, and already the prize's identity.

Both read storage directly rather than through a port: prizes and tickets live in `src/lib/`, outside the
hexagon's domain, so there is no port to widen — the same call `useSavedPlaybackPositions` makes.

`learnerAchievements` takes `isEarned` and `isClaimed` predicates, so the derivation stays pure and the
hook supplies both. `useLearnerAchievements` combines the stored tickets with today's completion and
records anything complete that is not yet stored, which is what keeps a ticket through an un-mark.

- *Alternative:* store the ticket inside the completion tracker. It would tie an act of the learner to
  the progress port and let un-marking erase what it earned.

### D13 — The lesson page hands over; the counter pays out

The ticket moment always plays, the module's last ticket included: the learner sees the ticket they just
earned, and the module's counter reads `17 / 17`. `PrizeReadyModal` opens from the toast's own `onDone`,
so the sequence is one thing after another rather than two surfaces at once.

The reveal moves to the counter. Claiming is a deliberate act there — the learner asks for the prize and
watches it appear — which is what an arcade counter does, and it gives the Achievements page a reason to
be visited beyond reading numbers.

### D14 — Claiming writes first, reveals second

`PrizeShelfItem` takes an `onClaim`; `AchievementsView` records the claim and then shows
`PrizeRedeemedModal`. Writing first means an Escape mid-animation still leaves the prize claimed, and the
shelf behind the dialog has already turned to its claimed state when the dialog closes.

The claim control disappears with the claim, so focus cannot return to it. `onCloseAutoFocus` moves focus
to the shelf item, which by then names the prize.

### D15 — Fullscreen: the notification follows the learner, the dialog waits for them

The browser paints only the fullscreened element and its descendants, so a pill fixed to the document
and a dialog portalled to `<body>` are both invisible while a lesson is watched fullscreen — measured,
not guessed. The two moments answer differently because they ask for different things:

- `TicketToast` portals its status region into `document.fullscreenElement` while there is one, so the
  ticket reaches the learner where they are looking. It costs them nothing: it takes no focus and leaves
  on its own.
- `PrizeReadyModal` waits. A modal over a video the learner chose to fill their screen interrupts the
  very thing they are doing, and an invisible dialog that still answers Escape is worse: the learner
  presses Escape meaning "leave fullscreen" and silently dismisses a prize they never saw. So
  `useLessonRewardMoment` holds the moment and opens it on the next `fullscreenchange` that leaves
  fullscreen.

`useFullscreenElement()` in `src/hooks/use-fullscreen-element/` is the shared reader: a
`useSyncExternalStore` over `fullscreenchange`, `null` on the server and whenever nothing is presented.

**The waiting dialog opens a beat after that event, not on it.** `fullscreenchange` fires when the exit
*begins*: measured, the dialog mounted in the same millisecond as the event, so its entrance animation
ran while the browser was still restoring the page and was over by the time the learner could see
anything. A short delay after the event — `PRIZE_READY_DELAY_AFTER_FULLSCREEN_MS` — lets the restore
finish, so the dialog is seen arriving instead of appearing to have been there all along. There is no
event for "the exit transition ended", which is why this is a named constant rather than a listener.

- *Alternative:* render both inside the fullscreen element. The prize dialog would then cover the video
  and have to be dismissed before watching can continue.

### D16 — The dialog hands the counter a `claim` search param, not a `#` anchor

**Go and claim the prize** links to `/achievements?claim=<moduleSlug>`, read with `nuqs` as the project
does for URL-bound state. `AchievementsView` then brings that prize into view, focuses it (the shelf item
already carries `tabIndex={-1}` and `data-prize-slug`), points it out with `prize-called` for a few
seconds, and clears the param so a reload points at nothing.

A `#prize-<slug>` anchor would have been simpler and does not work here: the counter is derived from
this device's storage, so at the moment the browser would act on the fragment the shelves do not exist
yet. Scrolling after the prizes have rendered is the only reliable order.

**The toy waves; nothing around it moves.** `prize-called` animates the prize illustration alone — a
short wave with a long rest between passes — and never the shelf item, because the Claim prize control
sits inside it and a control that shifts under the pointer is hard to press (Playwright cannot press one
at all, which is how the first version of this was caught). A box drawn around the item was the other
option and reads as a selection, not as a signal.

**The signal never uses gold.** Gold is what a prize wears once it is the learner's: the silhouette turns
into the coloured toy at the moment it is claimed. Lighting a prize gold while it is still unclaimed
spends that moment in advance, so the wave carries no gold, and the still fallback below is a neutral
glow.

The prize also carries a colourless aura the whole time it is waiting, not only as a fallback: a wave
is easy to miss between passes, and a shelf of silhouettes gives the eye nothing to land on. The aura
follows `--foreground`, so it reads as light on the dark theme and as depth on the light one.

Scrolling honours reduced motion (`behavior: "auto"`), and so does the pointing: without the wave, the
aura alone marks the prize. Neither is the only signal — the control names its module, and focus lands
on the prize.

### D11 — Language migration in one pass

Types, functions, components, message keys, tests, stories and the e2e spec move from seal/badge to
ticket/prize together; `AchievementSeal` and `ModuleBadge` are deleted rather than aliased. `GLOSSARY.md`
gains **Ticket**, **Prize** and **Distinction** with a decision-log row rejecting *seal* and *badge*.

## Risks / Trade-offs

- [Fifteen toys is a lot of SVG] → each is a handful of primitives on a 64-unit grid; one story renders
  all of them in both states.
- [A module's prize is chosen by slug, so renaming a module folder changes its prize to the gift box] →
  a unit test lists every slug in the shipped content manifest and fails if one is missing from the
  catalog.
- [The redeem dialog is invasive] → it opens only on the completion that redeems a module — at most
  fifteen times in the whole catalog.
- [A learner un-marks and re-marks the last lesson] → the ticket was already earned, so nothing is
  announced a second time; the ready prompt opens again only while the prize is unclaimed.
- [Tickets outliving completion means the counter can read 17 / 17 for a module with un-marked lessons]
  → deliberate: the ticket records what the learner did, the lesson rows record where they are now.
- [A module renamed in the content changes its slug, orphaning its claim] → the prize is the slug's
  (D3), so a rename already changes the toy; the learner claims the new one.
- [Two moments at once if confetti and the dialog overlap] → confetti fires from the screen edges and the
  dialog sits over it; accepted.

## Migration Plan

None. Deploying shows tickets and prizes for lessons completed before the release; a learner who had
already finished a module finds its prize waiting to be claimed. Rolling back leaves only the
`learning-english:prize-claimed:*` keys behind, which nothing reads.

## Open Questions

None blocking.

## Testing strategy

- **Vitest unit** — `learner-achievements.test.ts` (ticket symbol, prize states incl. the empty module,
  totals, distinctions, prize per module), `module-prizes.test.ts` (known slugs, gift fallback, every slug
  in the content manifest is catalogued).
- **Vitest hooks** — `use-learner-achievements.test.ts` (marked, watched, un-marked);
  `use-lesson-reward-moment.test.ts` (no moment on mount when complete; ticket moment on transition; prize
  modal on the transition that completes the module; no repeat; un-mark silent); `use-count-up.test.ts`.
- **Vitest + RTL** — `lesson-ticket`, `prize-icon` (every prize renders, silhouette hides detail colours),
  `prize-shelf-item` and `prize-counter` (names hidden until redeemed, accessible state, tags, order),
  `learner-achievements` (counts, shelves), `achievements-view`, `achievements-guide-modal`,
  `prize-redeemed-modal` (name, copy, Keep learning, See my prizes href, Escape, focus return),
  `ticket-toast` (status role, copy, auto-dismiss under fake timers), `lesson-view` (mounts the moment),
  `learner-card`, `site-header`. Motion asserted through classes and `--motion-order`, not timing.
- **Storybook** — stories per new component and modal in `en`, `es`, `pt`; a sheet of all prizes.
- **Playwright e2e** — `e2e/achievements.spec.ts`: menu reaches the page; a stored completion shows 1
  prize redeemed and the whistle named; a collecting prize announces its hidden state; How do they work?
  opens and closes. `e2e/lesson-rewards.spec.ts`: marking a lesson complete shows the ticket notification
  that then leaves; marking the only lesson of `1-introduction` opens the prize dialog naming the whistle,
  and See my prizes lands on the counter.
- **Visual review** — Playwright MCP of the counter, the toast and the dialog, with motion and with
  reduced motion.
