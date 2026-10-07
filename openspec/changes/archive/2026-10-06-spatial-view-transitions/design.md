## Context

The app is Next 16.2.9 (App Router) with React 19, next-intl and the React
compiler. Route changes are hard cuts. The only motion in the app is in-page:
the achievements, ticket, prize and install-guide keyframes in
`src/app/globals.css`, all sharing three easing curves.

All navigation already goes through one module, `src/i18n/navigation.ts`, which
re-exports next-intl's `Link`, `redirect`, `usePathname`, `useRouter` and
`getPathname`; 56 non-test files import from it, and AGENTS.md forbids
`next/link` and `next/navigation` directly. The root locale layout renders
`SiteHeader`, then `GlobalProviders > div.flex-1 > children`, then `SiteFooter`,
as direct children of a `flex-col` body. The header is `sticky top-0 z-30`.

Next 16.2 ships `experimental.viewTransition`, which makes route navigations
run inside `document.startViewTransition` when a React `<ViewTransition>`
boundary is affected. `<Link transitionTypes>` and
`router.push/replace(href, { transitionTypes })` attach transition types;
next-intl's `Link` forwards the prop. The installed guide
(`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) states that
browser back/forward carry no type.

The chosen look is "Variante B — Espacial" on the design canvas, whose
prototype classifies a navigation by its route pair and maps it to seven
motions with desktop and phone variants.

## Goals / Non-Goals

**Goals:**

- One rule decides every transition: a pure function of (from, to).
- Zero changes at the 56 navigation call sites.
- Only the page content moves; the header is an anchor.
- Degrade to today's behaviour wherever the API, a type, or motion consent is
  missing.

**Non-Goals:**

- Transitions on browser history navigation, server redirects, or in-page
  state changes (see proposal Non-goals).
- Shared-element morphs and the lesson letterbox.
- A general animation library or a JavaScript-driven transition runtime.

## Decisions

### D1. The motion is a pure function of the route pair — `src/lib/route-motion`

`routeMotion(from, to)` returns `"slide-forward" | "slide-back" | "depth-in" |
"depth-out" | "rise" | "sink" | "fade" | "none"`. It strips a leading locale
segment, query and hash, places each path (section with order, course page with
order, module, lesson, account, onboarding step with order, or unplaced), then
applies the rules in the spec. `routeTransitionTypes(from, to)` wraps it as the
`string[]` Next expects: `["route-<motion>"]`, or `[]` for `none`.

*Why not tag each link (`transitionTypes={["nav-forward"]}`), as the Next guide
does?* The guide's own caveat is that "you decide which links are forward and
which are back". Here the same component (`CourseStartLink`, `ResumeTile`) is
rendered on pages at different depths, so the right answer depends on where it
is rendered, not on what it is. A route-pair rule is also one unit-tested table
instead of 56 judgement calls.

*Why locale-less paths?* `usePathname()` from next-intl and every `href` in the
codebase are already locale-less; stripping a known locale prefix as well makes
the function safe to call with a raw `location.pathname`.

### D2. `Link` and `useRouter` tag navigations centrally

- `src/i18n/intl-navigation.ts` holds the bare `createNavigation(routing)`
  result (today's `navigation.ts` body).
- `src/components/route-link/route-link.tsx` is a client component wrapping
  next-intl's `Link`. It reads `usePathname()` and passes
  `transitionTypes={routeTransitionTypes(pathname, hrefPathname)}` unless the
  caller passed `transitionTypes`, the link has a `locale` prop, the href is
  external, or the pathname is `null`.
- `src/hooks/use-route-router/use-route-router.ts` wraps next-intl's router:
  `push` and `replace` add `transitionTypes` under the same conditions and
  spread the caller's options after, so an explicit value and `locale` win.
- `src/i18n/navigation.ts` keeps its export names:
  `Link` ← `RouteLink`, `useRouter` ← `useRouteRouter`, the rest from
  `intl-navigation`.

*Alternative: a `popstate`/click listener stamping `<html data-route-motion>`
and CSS keyed on that attribute.* It would also cover browser back, but it
races the navigation it describes (a stamp outlives a cancelled or redirected
navigation), needs its own cleanup clock, and bypasses the typed channel React
scopes to a single transition. Rejected for this change; the history case is a
listed non-goal.

*Server Components.* `Link` is imported by Server Components today. A client
wrapper is a valid child there as long as props are serialisable, which they
already are (`href` strings or `{ pathname, query }`, class names, children).
The wrapper uses next-intl's client `Link`, which resolves the locale from
`NextIntlClientProvider`; the locale layout mounts it above every page.

### D3. One `<ViewTransition>` boundary in the locale layout, triggered by update

`src/components/route-transition/route-transition.tsx` renders

```tsx
<ViewTransition update={ROUTE_CLASSES} default="none">
  <div className="flex flex-1 flex-col">{children}</div>
</ViewTransition>
```

where `ROUTE_CLASSES` maps each `route-<motion>` type to a view-transition
class of the same name and `default` to `"none"`. The layout puts
`GlobalProviders > div.flex-1 > children` and `SiteFooter` inside it.

- *Why the layout and not `template.tsx`?* A template at `[locale]` only
  remounts when the first segment changes; `/courses/a/about` →
  `/courses/a/progress` would never fire. One boundary above all pages fires
  for every route change.
- *Why `update` and not a `key={pathname}` with `enter`/`exit`?* Keying layout
  children by pathname remounts every nested layout on each navigation
  (`RequireLearnerProfile`, providers), which is a behaviour change nobody
  asked for. An un-keyed boundary sees a navigation as a mutation inside it and
  plays the `update` class for the transition's type on both the old and the
  new snapshot.
- *Why a wrapper `div`?* React names the boundary's top-level DOM nodes for
  the browser. One node means one snapshot containing page and footer, so the
  footer travels with its page instead of ghosting between two positions. The
  wrapper takes over `flex-1` from the body's column so the footer stays
  pinned to the bottom on short pages.
- *`default="none"`* keeps untyped transitions instant: Suspense reveals after
  `loading.tsx`, `router.refresh()`, server redirects, browser back.

If the browser check in task 6.2 shows `update` does not fire for a navigation
that replaces the whole subtree, the fallback is the keyed variant with the
same class map on `enter` and `exit`; the CSS is identical either way.

### D4. `ViewTransition` is read defensively from React

Next's App Router bundles a React canary that exports `ViewTransition`; the
`react@19.2.4` installed for Vitest and Storybook does not. `RouteTransition`
therefore resolves the component once at module scope
(`React.ViewTransition ?? Fragment`-equivalent, typed through
`react/canary`) and renders its wrapper `div` either way, so tests and stories
render the same DOM without the boundary.

### D5. The header is a named, static transition group

`SiteHeader`'s `<header>` gets `view-transition-name: site-header`
(Tailwind arbitrary property). CSS pins the group: no animation, old snapshot
hidden, `z-index` above the page group. Without this the page snapshot, which
includes content scrolled beneath the sticky header, is painted above the root
snapshot that holds the header.

### D6. All motion is CSS in `globals.css`, on three shared curves

New tokens on `:root`: `--motion-ease-enter: cubic-bezier(0.22, 1, 0.36, 1)`,
`--motion-ease-exit: cubic-bezier(0.55, 0, 0.35, 1)`,
`--motion-ease-move: cubic-bezier(0.65, 0, 0.35, 1)`, the curves the existing
keyframes already hard-code. Existing rules are not rewritten to use them.

Rules target `::view-transition-old(.route-<motion>)` and
`::view-transition-new(.route-<motion>)` with the durations, offsets and delays
from the Variante B prototype. Phone variants live under
`@media (max-width: 639px)`, matching Tailwind's `sm` boundary used across the
app. "Old on top" motions (`depth-out` and `sink`) raise the old snapshot with
`z-index`.

Reduced motion: the existing global rule cannot reach `::view-transition-*`
pseudo-elements (they are not matched by `*`), so a dedicated
`@media (prefers-reduced-motion: reduce)` block replaces every route class
with a 120 ms opacity-only crossfade.

*Alternative: per-motion durations as custom properties.* Deferred; nothing
else reads them yet.

### D7. `experimental.viewTransition` is turned on in `next.config.ts`

A one-line config change, called out because it is an experimental flag. It
only alters how navigations commit; with no boundary affected, or no browser
support, behaviour is unchanged.

## Risks / Trade-offs

- **Experimental flag and canary API** → The whole feature sits behind one
  config line and one layout component; removing either restores hard cuts.
  D4 keeps the test and Storybook stacks independent of the canary export.
- **The page is inert while a view transition runs** (the snapshot overlay
  takes pointer events) → every motion is capped at 450 ms; the common ones
  are under 400 ms.
- **`Link` becomes a client component everywhere** → small additional client
  JS per page that renders a link (next-intl's client `Link` plus one pure
  function). Server Components that render `Link` keep working because props
  are serialisable. Verified by `pnpm typecheck`, the existing component
  tests, and the e2e suite.
- **A redirected navigation plays the wrong motion** (a link to `/learning`
  while signed out lands on `/sign-in` with `slide`, not `rise`) → accepted;
  the motion is still short and directional, and the case is rare.
- **Signing in plays no transition.** Found while verifying: the sign-in form's
  `router.replace` + `router.refresh` ends in a full document load today, and a
  document load is outside any view transition. `sink` still plays wherever the
  account or onboarding flow is left by a client navigation (account deleted →
  home, the last onboarding step → the course). Making sign-in a client
  navigation is its own change.
- **Lesson-to-lesson is always `slide-forward`**, even when the learner picks
  an earlier lesson in the outline → accepted for this change; the override
  prop exists (spec: "A link that knows better") for a follow-up that passes
  the outline's order.
- **Large snapshots on long pages** (course details is ~1200 px tall on
  desktop, more on a phone) → transforms and opacity only, no layout
  animation; checked on the iOS simulator in task 6.3.
- **Safari renders some view-transition animations differently** → the visual
  check covers WebKit; anything that cannot be made right there falls back to
  `fade` for that engine via `@supports` only if needed.

## Migration Plan

No data or URL changes. Ship behind the single config flag. Rollback: revert
the commit, or set `experimental.viewTransition` to `false`, which leaves the
wrappers in place and inert.

## Testing strategy

- **Vitest unit — `src/lib/route-motion/route-motion.test.ts`**: the full
  route-pair table from the spec (sections, depth, siblings, onboarding,
  account, unplaced, same route, locale prefix, query and hash), plus
  `routeTransitionTypes`. Mirrors the table-driven style of
  `src/components/site-header/site-header.test.tsx`'s `sectionKey` cases.
  Paths are literal here, per the AGENTS.md faker exception: the behaviour is
  tied to the exact form of the input.
- **Vitest unit — `src/hooks/use-route-router/use-route-router.test.ts`**:
  with `./intl-navigation` mocked, `push`/`replace` forward the computed
  `transitionTypes`, keep caller options (`locale`), let an explicit
  `transitionTypes` win, and add nothing when the pathname is `null`.
- **Vitest component + RTL — `route-link.test.tsx`**: with the next-intl
  `Link` mocked to expose its props, asserts the computed types per pathname,
  the explicit override, no types for external / same-route / locale links,
  and that a `null` pathname still renders the anchor. Mirrors how
  `src/components/next-mocks.test.tsx` inspects mocked Next primitives.
- **Vitest component + RTL — `route-transition.test.tsx`**: renders children
  inside the flex wrapper when React has no `ViewTransition`; with
  `ViewTransition` mocked, asserts the `update` class map covers every motion
  and `default` is `"none"`.
- **Vitest component — `site-header.test.tsx`** (existing file): the header
  element carries the `site-header` view-transition name.
- **Playwright e2e — `e2e/route-transitions.spec.ts`**: an init script wraps
  `document.startViewTransition` to record each call's `types`. Following a
  catalog poster to its course page records `route-depth-in`; the course
  page's back link records `route-depth-out`; a browser `goBack()` records no
  route type; and with the API deleted the navigation still lands. Skipped on
  engines where the API is absent. Mirrors the signed-in setup of the existing
  course specs.
- **Manual visual check (Playwright MCP + iOS simulator)**: every motion on a
  1280 px and a 390 px viewport, the header anchor while scrolled, and reduced
  motion via `browser_emulate_media`.
