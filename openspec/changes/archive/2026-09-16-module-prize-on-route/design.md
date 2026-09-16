## Context

The module overview's progress-dependent part is one client subtree, `ModuleRoute`. It reads the
learner's progress once through `useModuleRoute` and hands the same reading to `ModuleProgressPanel` and
to every `ModuleRouteStep`, so the panel's count and the route's steps cannot disagree. Until that
reading arrives (`isRead: false`) nothing asserts progress.

Everything the prize needs already exists:

- `useLearnerAchievements(levels)` combines the completion, playback, ticket and claim stores and returns
  `learnerAchievements(...)`, where each module carries `prize`, `prizeState`
  (`claimed | ready | collecting | locked`), `ticketsEarned` and `tickets`. It also records tickets for
  lessons completed before tickets were stored, idempotently.
- `AchievementLevel` is `{ course, modules, lessonRuntimes }`, and `toLessonProgressSlice(lesson)` builds
  a runtime from a `Lesson` — so the page's own `course`, `module` and `lessons` props are enough.
- `PrizeIcon` draws any prize in colour or as the `--prize-silhouette` silhouette; `PrizeShelfItem`
  already owns the counter's wording (`???`, `N / M`, `Redeemed`, `Claim prize`, and the three
  assistive-technology sentences) under `Components.PrizeShelfItem`.
- The prize-ready dialog links to `/achievements?claim=<moduleSlug>`; the counter reads `claim` with
  `nuqs` and points at that prize while it is ready.

The approved sketches are options 1 (prize in the panel) and 2 (prize at the end of the route) of the
"Premio de la lección · Vowels" design canvas, with two corrections from review: the hidden prize is the
counter's silhouette — not a trophy in a disc with a lock badge — and there is no share action.

## Goals / Non-Goals

**Goals:**

- Show the module's prize where the learner walks the module, in both the panel and the route's end.
- One reading of the prize for both surfaces, from the same stores and rule as the counter.
- Keep the counter's surprise: silhouette and `???` until claimed.
- Assert nothing before progress is read; keep the first frame stable.

**Non-Goals:**

- Claiming, revealing or sharing on this page (see the proposal's non-goals).
- Any change to the steps, the featured card, the panel's figures, the counter or the dialogs.

## Decisions

### D1 — `useModulePrize` reads one module through `useLearnerAchievements`

A new hook, `src/hooks/use-module-prize/use-module-prize.ts`, takes `{ course, module, lessons }`, builds a
single `AchievementLevel` (memoised on the lessons), calls `useLearnerAchievements` and returns a typed
reading for that module:

```ts
type ModulePrizeReading =
  | { hasPrize: false }
  | { hasPrize: true; prize: PrizeId; state: PrizeState; ticketsEarned: number; ticketCount: number };
```

`hasPrize: false` covers a module with no lessons, which `learnerAchievements` drops.

- *Alternative:* recompute tickets inline, as `useLessonRewardMoment` does. Rejected: that is a second
  implementation of the state rule (claimed → ready → collecting → locked) the spec says must match the
  counter.
- *Alternative:* load the whole catalog through `GlobalProviders`. Rejected: the page already holds the
  one module it needs, and the achievements result for one level is the same arithmetic.
- *Consequence:* opening the module overview now records tickets for lessons already complete, exactly as
  opening the Achievements page does. `earnTickets` only writes what is new.

### D2 — `ModuleRoute` reads the prize once and gates it on the route reading

`ModuleRoute` calls `useModulePrize` beside `useModuleRoute` and passes the same prize reading, together
with the route's `isRead`, to the panel's row and to the finale. The ticket stores have no "read" flag of
their own (they are empty sets on the server), so the route's `isRead` is the one signal that the device
has been read — reusing it keeps the prize from flashing `0 / 17` before the real count.

### D3 — One `ModulePrize` component with two layouts

`src/components/module-prize/module-prize.tsx` renders the prize from `{ module, prize, isRead, layout,
nextLesson? }`, where `layout` is `"panel"` or `"finale"`. Both layouts share one
implementation of:

- the illustration: `PrizeIcon` with `locked` unless `state === "claimed"`, and the counter's
  `.prize-glow` when claimed;
- the withheld name (`???`) or the prize's name (`Components.PrizeIcon.names`);
- the tag: `.lesson-ticket` reading `N / M` while locked or collecting, `Redeemed` when claimed;
- the state line (`Components.ModulePrize`): tickets still needed, or every ticket collected;
- the **Claim prize** link while ready — `Link` from `@/i18n/navigation` to `/achievements?claim=<slug>`,
  named with `PrizeShelfItem.claimLabel`, as a secondary text link (see D6);
- one `sr-only` sentence from `PrizeShelfItem`'s `redeemedLabel` / `readyLabel` / `hiddenLabel`, with the
  visible illustration, name, tag and line hidden from assistive technology, as the shelf item does.

The layouts differ only in frame:

- **panel** — a divider under the figures, then a row: the prize at 56px beside the label, name, line and
  tag, with the claim link at the end of the label's line. Before `isRead`, only the label, the silhouette
  and `???` render in the same box.
- **finale** — a rail column matching the steps' (`w-11` / `lg:w-16`) and a card. The marker is a dashed
  ring while locked or collecting and a solid gold disc when ready or claimed (shape, not just colour).
  Locked/collecting: a dashed-border card, subordinate to the steps. Ready/claimed: the current card's
  frame (`border-gold/45`, card background, gold shadow) with the prize on the current card's glow
  panel. Before `isRead`, the finale renders nothing: it sits below every step, so nothing moves.

- *Alternative:* two components (`ModulePrizeRow`, `ModulePrizeFinale`). Rejected: every rule above would
  be written twice, and the spec requires both surfaces to agree.
- *Alternative:* reuse `PrizeShelfItem` directly. Rejected: its vertical shelf layout, `li` root and
  `button` claim (which records a claim) belong to the counter; this page only links to it.

### D4 — The finale sits after the list, not in it

`ModuleRoute` renders the finale as a sibling after the `<ol>` of steps, in the same column. The last
step's connector already runs to the bottom of its item, so the rail reads continuous into the finale's
marker. The steps' `data-state`, the list's item count and `findContinueTarget` are untouched.

### D5 — Reuse the counter's words; add only what is new

`Components.PrizeShelfItem` (`hiddenName`, `tag`, `redeemed`, `claim`, `claimLabel`, the three sentences)
and `Components.PrizeIcon.names` are read as they are, so the page and the counter cannot drift apart.
`Components.ModulePrize` adds only the eyebrows and the two state lines, in `en`, `es` and `pt`, as ICU
plurals:

| Key | es |
| --- | --- |
| `eyebrow` | Premio de la lección |
| `readyEyebrow` | Premio listo |
| `claimedEyebrow` | Premio canjeado |
| `ticketsLeft` | Te faltan {count, plural, one {# ticket} other {# tickets}} para reclamarlo |
| `allTickets` | Juntaste {count, plural, one {el único ticket} other {los # tickets}} |

### D6 — Review changes: a text link to claim, the next lesson as the finale's action, a trophy marker

After review in the browser:

- **Claim prize is a text link**, styled like the lesson page's Unmark (`text-muted-foreground underline
  underline-offset-4`, hover to foreground) at 13px, the size of the state line beside it. The claim is a
  detour to the counter, not the page's main action, and must not compete with the route's buttons.
- **It sits on the prize label's line**, in the panel and in the finale, aligned by baseline. The link's
  box is only its text so the baselines match; a `::after` extends the pointer target to 44px without
  moving the line. (Negative margins were tried first and shifted the text above the label.) The label
  never wraps; if a locale's copy does not fit, the link drops to the next line instead.
- **The finale's primary action is Start Lesson NN →** once every ticket is in (ready or claimed). The
  next module comes from `findModuleForView`, which already lists the course's lessons and now also the
  course's modules, and resolves the first later module holding lessons. Where it leads is the course
  overview tile's rule, moved from `LessonRingTile` into `moduleEntryPath` in `src/i18n/lesson-routes.ts`
  so both surfaces open a lesson in the same place. The page computes the path on the server and hands
  `{ sequence, href }` down through `ModuleOverview` and `ModuleRoute` to the finale.
- **The finale's marker carries a trophy** (lucide `Trophy`) instead of a ticket; the dashed ring versus
  solid disc still tells the states apart by shape.

- *Alternative:* a separate `findCourseForView` call from the page for the next module. Rejected: a
  second round-trip for one neighbour the module use case can resolve from data it already loads.

## Risks / Trade-offs

- [The panel reads `16 of 17 videos` while the prize reads ready after an un-mark] → Intended: tickets are
  kept by `learner-achievements`. The spec states it as a scenario so it is not "fixed" later.
- [Two Claim prize links on the page when ready] → Both are named after the module and lead to the same
  place; on a phone they are a screen apart (panel on top, finale at the end), which is why both exist.
- [Opening the page writes tickets] → Same idempotent write the Achievements page already performs; it
  only ever adds tickets the completion rule already grants.
- [Store snapshots are module-level in tests] → Tests use fresh lesson ids and slugs or call
  `refreshEarnedTickets` / `refreshPrizeClaims`, as `use-learner-achievements.test.ts` does.
- [The panel grows taller on phones, pushing the route down] → Accepted from the approved sketch; the
  row keeps its shape from the first frame, so there is no jump.

## Testing strategy

- **Vitest unit (hook)** — `src/hooks/use-module-prize/use-module-prize.test.ts`, mirroring
  `use-learner-achievements.test.ts` (`renderHook`, seeding `learning-english:completed:`,
  `learning-english:ticket-earned:` and `learning-english:prize-claimed:` keys, then refreshing the
  stores): locked, collecting with counts, ready, claimed, a kept ticket after un-mark, and a module
  with no lessons (`hasPrize: false`).
- **Vitest + RTL (component)** — `src/components/module-prize/module-prize.test.tsx`, mirroring
  `prize-shelf-item.test.tsx` and `module-progress-panel.test.tsx` (the `next-intl` key-echo mock, props
  only, BDD `GIVEN/WHEN/THEN` names): per state and per layout — silhouette vs colour
  (`data-locked`), `???` vs name, tag text, state line, the claim link's name and `href`, no link unless
  ready, the `sr-only` sentence, the finale marker's shape, and the before-read frames (panel keeps only
  silhouette and `???`; finale renders nothing).
- **Vitest + RTL (integration)** — `module-progress-panel.test.tsx` gains the row it is handed;
  `module-route.test.tsx` (real stores, `announceStorageChange`) asserts the finale renders after the
  list, the list still has one item per lesson, the server frame (`renderToString`) shows no ticket tag or
  claim link, and panel and finale show the same state.
- **Stories** — `module-prize.stories.tsx` (both layouts × locked, collecting, ready, claimed, not read)
  and new `module-route.stories.tsx` states using `seedVowelsProgress` extended to seed tickets and a
  claim.
- **Playwright e2e** — `e2e/module-route.spec.ts`, seeding with `addInitScript` as it already does: a
  collecting module shows `11 / 17` in the panel and the finale and still 17 steps; a ready module's Claim
  prize link opens `/en/achievements?claim=2-vowels`; a claimed prize shows its name; no horizontal scroll
  at 390px with the finale present.
- **Visual review** — Playwright MCP at 1440px and 390px, dark and light themes, all four states.
