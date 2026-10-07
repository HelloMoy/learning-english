## Why

Every route change in the app is a hard cut: one page disappears and the next
appears with nothing telling the learner whether they moved sideways to another
section, went deeper into a course, or came back out. The transitions design
canvas compared three treatments across all 21 views, and "Variante B —
Espacial" was chosen to ship: navigation gets a direction, so the motion itself
says where the learner is in the app.

Design reference: <https://claude.ai/artifact/4tYNzft3hvFWXTa3RzD5WG>
(artboard "Variante B — Espacial").

## What Changes

- Every in-app navigation plays a transition chosen from the pair of routes it
  connects, not from the link that was clicked:
  - **Between top-level sections** (home, My learning, Courses, Achievements,
    Profile): a short lateral slide, forward or back by the sections' order.
  - **Going deeper** (catalog → course → module → lesson): the new view grows
    in from 0.96 while the old one recedes; on a phone the new view pushes in
    from the right over a dimmed old one.
  - **Coming back up** (lesson → module → course → catalog): the reverse; on a
    phone the current view pops off to the right.
  - **Sibling views** (course details ↔ course progress, lesson → another
    lesson), **onboarding steps** and **account forms**: the same lateral
    slide, in the direction of travel.
  - **Into an account page from the app** (sign-in, account deleted): the view
    rises from below; on a phone it comes up as a sheet. Leaving the account or
    onboarding flow into the app sinks it away.
  - **Legal pages and unknown routes**: a plain fade.
- The site header never moves during a transition. The footer belongs to the
  page and travels with it.
- A learner who asked for reduced motion gets a 120 ms crossfade with no
  movement or scaling, for every kind.
- `Link` and `useRouter` exported from `@/i18n/navigation` tag each navigation
  with its transition on their own, so the 56 files that already navigate
  through them need no change. A call site that knows better (a "previous
  lesson" link) can still pass `transitionTypes` explicitly.
- `next.config.ts` turns on `experimental.viewTransition`, the Next 16.2 switch
  for React's `<ViewTransition>` during route navigations.

## Capabilities

### New Capabilities

- `route-transitions`: which transition each route change plays, what stays
  still while it plays, how it degrades under reduced motion and in browsers
  without the View Transitions API, and how navigation code opts in.

### Modified Capabilities

<!-- None. No existing requirement changes: pages keep their content, routes
     and focus behaviour; this change only adds motion between them. -->

## Non-goals

- **Browser back/forward and swipe-back gestures.** Next does not attach a
  transition type to history navigations, so they stay instant, exactly as
  today. Working around that with a hand-rolled `popstate` channel is a
  separate change, and has to account for iOS Safari already animating the
  swipe.
- **Shared-element morphs** (the poster growing into the course hero) and the
  **letterbox on entering a lesson**. Those belong to the canvas's
  "Recomendación" and "Cine" variants, not to Variante B.
- **Animating loading skeletons into content.** A `loading.tsx` fallback
  arrives with the route transition and is replaced by its content without
  motion, as it is now.
- **In-page motion**: modals, the lesson outline drawer, tab switches, the
  theme toggle and the locale switcher keep their current behaviour.
- **Server-side redirects** (session gate, onboarding gate). They carry no
  transition type and stay instant.

## Impact

- **Config**: `next.config.ts` gains `experimental.viewTransition: true`. This
  is an experimental Next flag; it changes how route navigations commit in
  browsers that support View Transitions.
- **Navigation surface**: `src/i18n/navigation.ts` keeps the same exports, but
  `Link` becomes a client wrapper around next-intl's `Link` and `useRouter`
  a wrapper around next-intl's router. Both stay locale-aware.
- **Layout**: `src/app/[locale]/layout.tsx` wraps page content and footer in a
  single transition boundary; `SiteHeader` gets a view-transition name so it
  can be held still.
- **Styles**: `src/app/globals.css` gains motion tokens (three easing curves,
  already used by the achievements and ticket animations) and the
  view-transition rules, including the phone and reduced-motion variants.
- **New modules**: `src/lib/route-motion`, `src/components/route-link`,
  `src/components/route-transition`, `src/hooks/use-route-router`, each with
  colocated tests; the two components with stories.
- **Tests**: component tests that render `Link` now also call
  `usePathname()`; no existing test mocks need to change (next-intl's
  `usePathname` returns `null` outside the App Router, which the wrapper
  treats as "no transition"). One new Playwright spec.
- **Browsers**: Chrome, Edge and Safari 18+ animate. Firefox builds without the
  API, and any browser with the flag's integration unavailable, navigate
  exactly as today.
