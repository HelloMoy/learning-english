## Why

Collecting a module's last ticket opens a dialog telling the learner a prize is waiting — but only if
they stay on the lesson for the five seconds the ticket notification lasts. Measured in a browser: press
**Up next** or leave for another section in those five seconds and the dialog never opens. Nothing is
lost (the ticket is stored and the prize waits on the counter), but the learner is never told, and the
same hole swallows the announcement for anyone who closes the tab or moves on the moment a video ends.

A prize worth walking to the counter for should not depend on standing still.

## What Changes

- **The announcement survives the page.** When the module's last ticket is earned, that the prize is
  waiting is recorded on the device. If the learner leaves before the dialog opens, it opens on the next
  page they land on. Seeing it — or claiming the prize — clears the record.
- **An unclaimed prize is visible from anywhere.** While any prize is ready to claim, the avatar menu
  marks its Achievements item, and the avatar itself carries the same mark so it is visible with the
  menu closed. The mark says how many prizes wait, and it is gone once they are claimed.
- The `SiteHeader` receives the catalog from the layout, as the Achievements page already does, so it
  can count what is ready without inventing a second source of truth.

## Capabilities

### New Capabilities

<!-- None: this covers an announcement the platform already makes. -->

### Modified Capabilities

- `learner-achievements`: the waiting-prize announcement outlives the lesson page, and an unclaimed
  prize is marked wherever the learner is.
- `cinema-home`: the avatar menu marks Achievements while a prize is unclaimed.

## Non-goals

- Notifications outside the app (push, email), or any announcement for tickets — only prizes.
- Nagging: the announcement is shown once, and the mark is a count, not an interruption.
- Changing what readies or claims a prize, or the counter itself.
- Marking anything for a prize the learner has already claimed.

## Impact

- `src/hooks/use-prize-claims/` or a sibling store for the pending announcement, read by both surfaces.
- `src/hooks/use-lesson-reward-moment/` records the announcement instead of only showing it.
- `src/components/global-providers.tsx` — where a pending announcement is shown on the next page.
- `src/components/site-header/` and `src/app/[locale]/layout.tsx` — the catalog reaches the header.
- `src/messages/{en,es,pt}.json` — the mark's accessible wording.
- `e2e/lesson-rewards.spec.ts` — leaving early still gets the announcement, and the mark shows.
