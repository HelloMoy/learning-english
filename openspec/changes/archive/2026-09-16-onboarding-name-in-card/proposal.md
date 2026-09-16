## Why

The first onboarding step asks for the learner's name twice over: the learner card shows `Tu nombre`
in muted type where the name will go, and the real field sits below the card. Learners read the card's
placeholder as the field and click it, and nothing happens. Two places asking for one thing, only one of
which answers.

## What Changes

- The learner card's name becomes the field in step 1: the learner types their name where it will live,
  and the separate name input below the card is removed.
- The field looks like a field inside the card — its own resting line, a caret, a visible focus ring —
  so it reads as somewhere to type rather than as text that happens to be there. It carries the same
  accessible name, `autocomplete`, and maximum length the input has today.
- The card keeps its live preview behaviour everywhere else: on the Profile and the Achievements page it
  stays a card, not a form.
- **Continue** keeps its place and its rule: it stays disabled until a name is typed, and saves the same
  profile it saves today.

## Capabilities

### New Capabilities

<!-- None: this changes how an existing step behaves, not what the platform can do. -->

### Modified Capabilities

- `learner-onboarding`: step 1 collects the name in the learner card itself rather than in a field
  below it.

## Non-goals

- The avatar step, and any other way of editing a profile — the Profile page keeps its own form.
- Editing the name in the card anywhere outside the onboarding (Profile, Achievements).
- Changing what a profile is, how it is stored, or where the onboarding leads.
- Validation beyond what step 1 does today (a name that is not blank, within the maximum length).

## Impact

- `src/components/onboarding-name-step/` — the input moves into the card.
- `src/components/learner-card/` — the card learns to render its name as an editable field when asked,
  and keeps today's output when not.
- `src/messages/{en,es,pt}.json` — the field's label and placeholder move with it; `Onboarding.name.*`
  and `Components.LearnerCard.namePlaceholder` are revisited.
- `e2e/home.spec.ts` — the onboarding flow types into the card.
