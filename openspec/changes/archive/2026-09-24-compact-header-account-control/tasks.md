# Tasks: compact-header-account-control

## 1. E2E guard: the signed-out phone header

- [x] 1.1 Replace the wordmark clipping check in `e2e/mobile-viewport.spec.ts` with one that measures the clipping ancestor, since the link's own `scrollWidth`/`clientWidth` can never differ (design D7), and add a signed-out block at 320px asserting the wordmark is whole in `en`/`es`/`pt`. Confirm it goes red against today's build (TDD: test → impl)

## 2. The phone account trigger

- [x] 2.1 Add the `SiteHeader.accountMenuLabel` key to `src/messages/{en,es,pt}.json`; confirm `messages.test.ts` parity stays green
- [x] 2.2 Add failing component tests to `src/components/site-header/site-header.test.tsx`: without a session the header renders a `sm:hidden` account trigger whose menu offers Sign in linking to `/sign-in`, and a `hidden sm:inline-flex` Sign in link with the full label; with a session and no learner card the same trigger's menu offers Sign out (TDD: test → impl)
- [x] 2.3 Implement the trigger in `SessionControl`: a `CircleUser` trigger opening a `DropdownMenu`, one shared component for both session states, with the desktop link/button kept and hidden below `sm` (TDD: test → impl)
- [x] 2.4 Tighten the header's phone gaps: the row's outer gap and the control group's gap step down below `sm` and keep their current values from `sm` up (TDD: covered by 1.1's budget)

## 3. Verification

- [x] 3.1 Run `pnpm verify` (typecheck, format:check, lint, test:run) and fix any failure
- [x] 3.2 Run the touched e2e area serially on chromium against a dev server: `PLAYWRIGHT_BASE_URL=… pnpm test:e2e mobile-viewport.spec.ts --project=chromium --workers=1 -g "header|wordmark"` — no `--` before the args, which would make Playwright drop every flag
- [x] 3.3 Verify in the browser with Playwright MCP at 375px and 320px: the wordmark reads `ENGLISH·COURSE` whole, the account icon opens a menu offering Iniciar sesión, and the desktop header still shows the text link. Measure the remaining slack and record it
