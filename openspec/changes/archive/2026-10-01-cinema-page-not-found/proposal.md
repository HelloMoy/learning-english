## Why

The localized Page Not Found is the only screen under the locale segment that does not wear the Immersion Cinema theme: it is a centred card with `slate` borders and text, a 4px radius and an outline-only link, none of which exist anywhere else on the site. It also offers a single way out — the home — and never says which address failed, so a learner who mistyped a path cannot see the typo.

## What Changes

- The Page Not Found state is laid out on the site grid, left-aligned with the wordmark, with no bordered card: a gold **Error 404** eyebrow, the existing "Page not found" heading at page-title size, and the existing description in muted ink.
- A line under the description names the path that was requested ("There's nothing at `/es/leccion-perdida`"), so a mistyped address is visible.
- The home link becomes the gold primary action. A secondary **View courses** action opens the course lobby (`/courses`) in the active locale.
- Every colour comes from the theme tokens, so the page follows the light and dark variants like the rest of the site.
- New copy (eyebrow, the path line, View courses) in `en`, `es` and `pt`.

Unchanged: the heading and description copy, the `role="alert"` region, the 404 status decided in the proxy, and the home link keeping the active locale.

## Non-goals

- The lesson route's own not-found (`lessons/[lessonId]/not-found.tsx`) keeps its current look. It shows a different message and deserves its own change.
- No learner data on this page: no "next up" bar, no session lookup. The page stays static.
- No route suggestions ("did you mean…").
- No change to how the 404 status is decided (`missingPage` in the proxy) or to which paths count as known routes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lesson-view-polish`: adds requirements to the localized Page Not Found — it names the requested path, offers the course lobby as a second way out, and uses the Immersion Cinema theme tokens. The existing requirement (status, locale-preserving home link, copy that blames the page and not the language) is untouched.

## Impact

- `src/app/[locale]/not-found.tsx` and its test — new layout, eyebrow, secondary action.
- `src/app/[locale]/missing-path.tsx` (new, client) and its test — the line naming the requested path.
- `src/messages/{en,es,pt}.json` — three new keys under `PageNotFound`.
- `e2e/not-found-routes.spec.ts` — the path line and the View courses action.
- No new dependencies, no domain or adapter changes.
