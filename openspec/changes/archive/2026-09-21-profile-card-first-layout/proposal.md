## Why

The Profile page still has the shape it had when it only edited a name and an avatar: a seven-column
form beside a five-column card that stops a third of the way down the page. Since then the page has
grown an Account section, a change-password form, a change-email form and a delete-account section —
all stacked in that same left column, while the right column leaves a metre of empty background on
every desktop screen.

Three things follow from that shape. The page has no summary: a learner who opens it sees a form,
never what they have done. Save and Discard sit mid-page and scroll out of reach the moment the
account forms push them up. And "Delete account" ends the same column as "Save changes", with the
same visual weight as everything above it.

The approved design direction — *Carnet primero* — fixes all three by leading with the card and the
learner's progress, then naming every part of the page as a section of its own.

## What Changes

- The page header becomes the learner: eyebrow `Perfil`, the learner's **name** as the `h1`, and one
  line saying what the page holds. The card stops being a "preview" labelled as such.
- A new full-width band opens the page: the large learner card on the left and, beside it, a
  **progress panel** — a ring with the completed percentage, the completed-of-total video count, a
  bar, and the counts of tickets earned and prizes claimed, all derived from data the route already
  loads.
- Everything below becomes a single column of **named sections**: `Identity` (name field + avatar
  picker), `Account` (today's `AccountSection`, unchanged in behaviour), `Preferences` (interface
  language and theme), and `Delete account` last, set quieter than the sections above it.
- **Save** and **Discard** leave the inline row and move to a **save bar docked to the bottom edge of
  the viewport**, which exists only while there are unsaved changes and carries the saved
  confirmation. The disabled pair of buttons that today occupies space while doing nothing is gone.
- Language and theme become reachable from the Profile page, not only from the site header.
- New copy in `en`, `es` and `pt` for the header, the section titles, the progress panel and the save
  bar.

## Capabilities

### New Capabilities

None. The page keeps the capability it already has.

### Modified Capabilities

- `profile-page`: the page's structure changes — a card-and-progress band opens it, the form and the
  account settings become named sections, a preferences section is added, and saving moves to a
  docked bar that only exists while the card is dirty. The rules about what Save and Discard *do*,
  and about the live preview, are unchanged.

## Impact

- `src/components/profile-view/profile-view.tsx` — rewritten layout; the editor keeps its state
  machine (draft until Save, dirty tracking, trimmed name).
- New components under `src/components/`: a progress band for the card, a section wrapper for the
  page's named sections, and the docked save bar. Each with stories, tests and JSDoc, per `AGENTS.md`.
- `src/app/[locale]/profile/page.tsx` — passes the whole catalog (`catalogLevels`) in addition to the
  first level, so the band can count tickets and prizes. `loadCatalogEntries` is already cached per
  request, so this costs no extra read.
- `src/app/[locale]/profile/loading.tsx` and the in-page skeleton — reshaped to the new layout.
- `src/messages/{en,es,pt}.json` — new keys under `Profile.*`.
- Reuses without changing: `LearnerCard`, `AvatarPicker`, `AccountSection`, `DeleteAccountSection`,
  `LocaleSwitcher`, `ThemeToggle`, `useLearnerAchievements`, `useCourseWatchProgress`.
- `e2e/learner-account.spec.ts` and the profile component tests assert the current layout in places
  and will need updating.

## Non-goals

- **Email reminders.** The mockup showed a "weekly reminders" row. Nothing stores or sends that, so
  it is not built.
- **A day streak.** The mockup showed "4 days in a row". No streak is recorded anywhere; the band
  shows only progress, tickets and prizes, which exist.
- **Changing what Save does.** Edits stay drafts until Save; this change does not introduce
  autosave, and does not add an undo.
- **A second route.** Everything stays on `/[locale]/profile`; no settings sub-pages, no new rail or
  tabs.
- **Touching the Account, password or email forms' behaviour.** They move into a named section and
  are otherwise left alone.
- **Redesigning the learner card itself**, the avatar artwork, or the achievements page.
