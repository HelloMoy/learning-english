## 1. Red — confirm the failure on a production build

- [x] 1.1 Remove the CI `test.fixme` from "Loading skeletons — route shells" and run the block with `CI=1` against `pnpm build && pnpm start`; record the failure (shell never visible) (TDD: test → red)

## 2. Green — model a slow page, not a browser without prefetch

- [x] 2.1 Make `holdTheNextPayload` delay only requests that carry `rsc` and not `next-router-prefetch` (TDD: red from 1.1 → impl)
- [x] 2.2 Before clicking, wait for the lesson's prefetch response, registered before the module page loads (TDD: red from 1.1 → impl)
- [x] 2.3 Run the block against the production build with `CI=1` until green, then `--repeat-each=5` to show it is deterministic

- [x] 2.4 Gate the block on `E2E_SERVER_COMMAND === "pnpm start"`: measured, `next dev` issues no prefetch, so the block cannot run there (design D3)

## 3. Verification

- [x] 3.1 Run the whole `loading-skeletons.spec.ts` against the production build (`CI=1`) and against `next dev`
- [x] 3.2 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`)
