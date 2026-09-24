## 1. Copy

- [x] 1.1 Add `SiteHeader.signUp` to `src/messages/en.json`, `es.json` and `pt.json` ("Create account" / "Crear cuenta" / "Criar conta"). (TDD: `messages.test.ts` key parity already guards every locale → add all three together)

## 2. Header menu

- [x] 2.1 (TDD: test → impl) RTL: with no session, opening the phone account trigger shows exactly the menu items `signIn` then `signUp`, and `signUp` links to `/sign-up`. Watch the test fail, then add the `DropdownMenuItem asChild` + `Link href="/sign-up"` to the signed-out branch of `SessionControl`.
- [x] 2.2 (TDD: test → impl) RTL: with a session but no learner card, the phone menu offers `signOut` and no `signUp`. Tighten the existing test. It should pass without code changes and guards against the item leaking into the wrong branch.
- [x] 2.3 Update the JSDoc on `AccountMenu` (`@param children`) and `SessionControl` to describe the signed-out menu's two items.

## 3. Verify

- [x] 3.1 Run `pnpm test:run` for the touched area, then `pnpm verify`.
- [x] 3.2 Check the phone menu in a real browser at a phone width, signed out, in `es`: it shows Iniciar sesión and Crear cuenta, and Crear cuenta opens `/es/sign-up`.
