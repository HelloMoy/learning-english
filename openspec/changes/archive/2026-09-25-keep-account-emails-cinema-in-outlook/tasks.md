## 1. Neutral fills

- [x] 1.1 (TDD: test → impl) Assert the ground is `#080808`, `#08080b` appears nowhere, and both radial layers end on `#080808`; watch it fail; move `CINEMA.ground` and the recomputed `glowWash` (`#2d2718`) in `src/emails/_shared/account-email.tsx`
- [x] 1.2 (TDD: test → impl) Assert the rule is `#262626` with its one-colour gradient and `#26262f` appears nowhere, and update the `[data-ogsb]` expectations to the new values; watch it fail; move `CINEMA.border`

## 2. Glow image

- [x] 2.1 Bake `public/emails/cinema-glow.png` (600 × 900, opaque) from the shell's two radial layers over `#080808` with sharp, and check it by eye against the CSS render in Playwright
- [x] 2.2 (TDD: test → impl) Assert a layer with no `background-color` carries `url(<origin of the link>/emails/cinema-glow.png)` sized `100% 100%`, not repeated, wrapping the bars and the frame; watch it fail; add the glow layer to the shell

## 3. Verify

- [x] 3.1 Render all five templates, check them in Playwright MCP (plain and under a simulated Gmail inversion), and confirm the image resolves on the local dev server
- [x] 3.2 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix anything it reports
- [x] 3.3 Send the rendered emails through Resend to the user's Outlook and Gmail inboxes for the device check
