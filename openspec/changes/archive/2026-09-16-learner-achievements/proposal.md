## Why

A learner who finishes lessons has nothing to show for it beyond a progress line on their card.
Rewards tied to what they actually completed make that progress visible and worth collecting,
without the daily pressure a streak would add.

The rewards borrow the arcade prize counter: every finished lesson drops a **ticket**, and a module's
tickets are redeemed for that module's **prize** — a different toy for each module, shown only as a
silhouette until every ticket is collected. A ticket and a prize look nothing alike, which the first
design (a gold seal and a gold badge) failed at.

The collection is a place of its own, reached from the learner's avatar menu, and the moment of
earning is celebrated where it happens: a short ticket notification on the lesson, and a curtain
dialog when a prize is redeemed.

## What Changes

- **Ubiquitous language:** a lesson earns a **Ticket**; a module's tickets redeem its **Prize**; the
  card's **Distinction** stays. The earlier terms *seal* and *badge* are removed from code, copy and
  specs.
- A lesson earns its ticket the first time it counts as complete, and **keeps it**: un-marking the
  lesson does not take the ticket away, and completing it again earns no second one. A ticket shows the
  lesson's sound (the first phonetic symbol between slashes in its title), or the lesson's position when
  the title names none.
- Every module has a **prize** from a catalog of arcade toys, chosen for what the module practises
  (Vowels → harmonica, Consonants → megaphone, …). A module whose slug the catalog does not know gets a
  generic gift box. A prize is **locked** (a silhouette) while no ticket is collected, **collecting**
  once some are, **ready to claim** once every ticket is collected, and **redeemed** once the learner
  claims it on the prize counter. The claim is the one thing this change stores on the device, and a
  claimed prize stays the learner's even if a lesson is later un-marked.
- Completing courses earns a **distinction**: `Student`, `Bronze` once one course is complete, `Gold`
  once every course is complete.
- `/[locale]/achievements` shows the learner card with its distinction, the tickets and prizes
  collected, and a **prize counter**: one shelf per course holding every module's prize, each with a
  hanging tag reading its tickets (`12 / 17`) or `Redeemed`, and its name hidden until claimed. A prize
  holding every ticket offers **Claim prize**, and claiming it opens the curtain dialog that reveals the
  toy. A **How do they work?** dialog explains tickets, prizes and distinctions. Everything moves on
  arrival, and nothing moves under reduced motion.
- **Ticket earned:** when the lesson being watched becomes complete, a pill notification rises at the
  top of the lesson page — the ticket drops out of a slot, with how many tickets the module holds and
  its prize's silhouette — and leaves on its own after a few seconds. It never blocks or takes focus,
  and it plays for every completion, the module's last one included.
- **Watching fullscreen:** the notification is drawn inside the video the browser is presenting, so it
  is seen there; the prize dialog waits until the learner leaves fullscreen rather than covering the
  lesson — or worse, listening for an Escape they meant for the video.
- **Prize ready:** when that completion collects the module's last ticket, the notification plays
  first; once it leaves, a dialog says a prize is waiting — without showing which — with **Go and claim
  the prize** (to the counter) and **Keep learning**. The curtain reveal now belongs to the counter,
  where the learner claims it.
- The avatar menu offers **Achievements** between My learning and Profile; the Profile page is
  unchanged.
- The learner card gains a finish for the distinction, shown only on the Achievements page.

## Capabilities

### New Capabilities

- `learner-achievements`: tickets, prizes and distinctions derived from lesson completion and the
  catalog; the prize catalog; the Achievements page and its prize counter; the ticket notification and
  the prize-redeemed dialog.

### Modified Capabilities

- `cinema-home`: the avatar menu offers Achievements, and the section eyebrow names the route.
- `site-metadata`: Achievements is a personal route that shares the home's card.
- `search-discoverability`: Achievements is kept out of search and out of the sitemap.

## Non-goals

- Special achievements (first lesson, watching without skipping, a study week), streaks, reminders.
- Storing prize states or distinctions. They stay derived from the tickets earned and the prizes
  claimed, which are the two stored facts — one flag per lesson and one per module.
- Re-celebrating a ticket earned or a prize claimed on an earlier visit.
- Announcing tickets or prizes anywhere but the lesson page where the lesson was completed.
- Illustrated artwork beyond the in-app SVG toys, and per-locale prize artwork.
- Any change to the Profile page, or a distinction finish outside the Achievements page.
- Syncing across devices. Completion is per device today, and rewards follow it.

## Impact

- `src/lib/learner-achievements/` — renamed to tickets and prizes; `src/lib/module-prizes/` holds the
  catalog.
- `src/hooks/use-learner-achievements/`, a hook that detects the moment a lesson becomes complete on
  the lesson page, and `src/hooks/use-prize-claims/` for the stored claims.
- Components: `LessonTicket` (replaces the seal), `PrizeIcon`, `PrizeCounter` (replaces the badge grid),
  `LearnerAchievements`, `AchievementsView`, `TicketToast`, and modals `PrizeReadyModal`,
  `PrizeRedeemedModal` and the updated `AchievementsGuideModal` — each with stories, tests, JSDoc and
  messages in `en`, `es`, `pt`.
- `src/components/lesson-view/lesson-view/` mounts the reward moments.
- `src/app/globals.css` — ticket, counter, toast and redeem motion.
- `GLOSSARY.md` gains Ticket, Prize and Distinction.
- New route `src/app/[locale]/achievements/`; `src/components/site-header/` menu item and section.
- `LessonProgressSlice` carries lesson title and sequence.
