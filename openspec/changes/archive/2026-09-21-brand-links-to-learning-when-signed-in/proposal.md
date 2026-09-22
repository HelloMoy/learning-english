## Why

The header wordmark is the one control present on every page, and a learner reaches for it to get
"back to the app". Today it always lands on the marketing home (`/[locale]`), which is the page a
signed-in learner has no reason to see: it sells the course they already bought into. The trip back
to their own pages costs them a second navigation through the avatar menu.

## What Changes

- The `ENGLISH·COURSE` wordmark SHALL point at `/[locale]/learning` when the request carries a
  session, and keep pointing at `/[locale]` when it does not.
- The destination follows the same server-decided `signedIn` flag the header already uses to choose
  between **Sign in** and the learner menu, so the wordmark and the account control never disagree
  about whether there is a session.
- Both destinations stay locale-aware through `@/i18n/navigation`, as they are today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cinema-home`: the "Global header shows brand and section chrome" requirement currently states the
  wordmark "links home" unconditionally. It changes to a session-dependent destination — the locale
  home without a session, My learning with one.

## Non-goals

- No change to the avatar menu, its items, or their order — **My learning** stays in the menu.
- No change to the section eyebrow, which keeps deriving from the route.
- No change to what the home route itself renders for a signed-in learner; this is about where the
  wordmark points, not about redirecting the home.
- No change to the hero's primary action, which keeps following the stored learner profile rather
  than the session.
- No new sign-out behaviour: sign-out keeps returning to the locale home.

## Impact

- `src/components/site-header/site-header.tsx` — passes an `href` to `<Brand />` derived from
  `signedIn`.
- `src/components/brand/brand.tsx` — unchanged; it already accepts an `href`.
- Tests: `src/components/site-header/site-header.test.tsx`; stories in
  `src/components/site-header/site-header.stories.tsx` already cover both session states.
- No new translation keys: the wordmark is not localized copy.
