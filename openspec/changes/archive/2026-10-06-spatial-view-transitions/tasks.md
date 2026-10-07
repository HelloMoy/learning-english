## 1. Route motion rule (pure logic)

- [x] 1.1 Add `src/lib/route-motion/route-motion.ts` with `routeMotion(from, to)` covering sections, course pages, modules, lessons, account pages, onboarding steps and unplaced routes, per the spec's route-pair scenarios (TDD: test → impl, table-driven cases in `route-motion.test.ts`)
- [x] 1.2 Make `routeMotion` ignore a leading locale segment, query strings and hashes, and return `none` for the same route (TDD: test → impl)
- [x] 1.3 Add `routeTransitionTypes(from, to)` returning `["route-<motion>"]`, or `[]` for `none` or a missing pathname, and export the list of motions for the CSS class map (TDD: test → impl)
- [x] 1.4 JSDoc the exported function, type and constants (clean-code pass: small functions, intention-revealing names)

## 2. Navigation wrappers

- [x] 2.1 Move the bare `createNavigation(routing)` result to `src/i18n/intl-navigation.ts`; keep `src/i18n/navigation.ts` re-exporting the same five names (TDD: existing suites stay green → refactor only)
- [x] 2.2 Add `src/hooks/use-route-router/use-route-router.ts`: `push`/`replace` add the route pair's `transitionTypes`, keep caller options, let an explicit value win, add nothing without a pathname (TDD: test → impl in `use-route-router.test.ts`)
- [x] 2.3 Add `src/components/route-link/route-link.tsx`: client wrapper over next-intl's `Link` that passes the route pair's `transitionTypes`; explicit prop wins; none for external, same-route, locale-switching links or a `null` pathname (TDD: test → impl in `route-link.test.tsx`)
- [x] 2.4 Export `RouteLink` as `Link` and `useRouteRouter` as `useRouter` from `src/i18n/navigation.ts`; run the full Vitest suite to confirm the 56 call sites and their tests are unaffected (TDD: existing suites are the failing/passing signal)
- [x] 2.5 Add `route-link.stories.tsx` (`Components/RouteLink`) and JSDoc for the component and the hook

## 3. Transition boundary and header anchor

- [x] 3.1 Add `src/components/route-transition/route-transition.tsx`: resolves `ViewTransition` defensively, wraps children in the `flex flex-1 flex-col` container, maps every `route-<motion>` type to its class on `update`, `default="none"` (TDD: test → impl in `route-transition.test.tsx`)
- [x] 3.2 Give `SiteHeader`'s `<header>` the `site-header` view-transition name (TDD: test → impl in the existing `site-header.test.tsx`)
- [x] 3.3 Wrap page content and `SiteFooter` in `RouteTransition` in `src/app/[locale]/layout.tsx` (TDD: layout test if one exists, otherwise covered by 5.1 → impl)
- [x] 3.4 Add `route-transition.stories.tsx` (`Components/RouteTransition`) and JSDoc

## 4. Motion styles and config

- [x] 4.1 Add the three `--motion-ease-*` tokens and the `route-*` keyframes and `::view-transition-old/new(.route-*)` rules to `src/app/globals.css`, desktop values from the Variante B prototype (TDD: e2e in 5.1 is the failing test → impl)
- [x] 4.2 Add the `max-width: 639px` variants: push/pop for depth, sheet for rise/sink, 64 px slide (TDD: visual check 6.3 → impl)
- [x] 4.3 Pin the `site-header` group: no animation, old snapshot hidden, above the page group (TDD: visual check 6.2 → impl)
- [x] 4.4 Add the `prefers-reduced-motion: reduce` block: 120 ms opacity-only crossfade for every route class (TDD: visual check 6.4 → impl)
- [x] 4.5 Turn on `experimental.viewTransition` in `next.config.ts` (TDD: e2e in 5.1 fails without it → impl)

## 5. End-to-end

- [x] 5.1 Add `e2e/route-transitions.spec.ts`: recording `document.startViewTransition` types, a catalog poster → course page navigation records `route-depth-in` and the course page's back link records `route-depth-out` (TDD: write first, watch it fail before 3.3/4.5 land)
- [x] 5.2 In the same spec: browser `goBack()` records no route type, and with `startViewTransition` removed the navigation still lands (TDD: test → impl already in place)

## 6. Verification

- [x] 6.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix every failure at its cause
- [x] 6.2 Visual check with Playwright MCP at 1280 px: each of the seven motions, the header holding still while the page is scrolled, footer travelling with the page; confirm the `update` trigger fires (else apply design D3's keyed fallback)
- [x] 6.3 Visual check at 390 px with Playwright MCP: push/pop, sheet, slide
- [x] 6.4 Visual check with reduced motion emulated: crossfade only
- [x] 6.5 Run `pnpm test:e2e` for `e2e/route-transitions.spec.ts` and the existing navigation-heavy specs on chromium and webkit
- [x] 6.6 Watch `sink` live at 1280 px and 390 px: account deleted → home, since signing in is a full document load and plays no transition
- [ ] 6.7 Check the phone motions on the iOS simulator (real Safari); simulator automation cannot tap a link, so this one is by hand
