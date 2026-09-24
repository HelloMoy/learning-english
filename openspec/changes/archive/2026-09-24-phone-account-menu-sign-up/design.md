## Context

Below `sm`, `SessionControl` in `src/components/site-header/site-header.tsx` puts the account action inside `AccountMenu`. That is an icon `DropdownMenuTrigger` named "Account menu", and its `DropdownMenuContent` receives the items as `children`. Without a session it currently gets one item, `<Link href="/sign-in">`. The sign-up route already exists at `/[locale]/sign-up`.

## Goals / Non-Goals

**Goals:**
- A second item, **Create account** → `/sign-up`, in the signed-out phone menu only.

**Non-Goals:**
- Any change to the desktop header, the signed-in menus, the trigger or the account pages (see the proposal).

## Decisions

- **Add the item as a child in the signed-out branch.** `AccountMenu` already takes its items as `children`, so the new `DropdownMenuItem asChild` + `Link` sits next to Sign in. `AccountMenu` does not change shape; only its JSDoc (`@param children`) stops saying "one account action".
  - *Alternative:* an `items` array prop on `AccountMenu`. Rejected, because it adds a second way to express what `children` already expresses.
- **New message key `SiteHeader.signUp`.** The copy is "Create account", "Crear cuenta" and "Criar conta". This matches the user's wording and the sign-up form's own submit label. It does not reuse `Account.signIn.signUpLink` ("Create an account" / "Crea una cuenta"), because the header's namespace owns its strings and a menu item wants the terse imperative, like its neighbours "Sign in" and "Sign out".
- **Sign in first, Create account second.** Returning visitors are the common case on a page they have already reached, and keeping Sign in in place means the existing menu does not move.

## Risks / Trade-offs

- [The trigger is still named "Account menu" with two items] → This was already the intended reading: the trigger names the menu, not an action.
- [This session shares the working tree with uncommitted install-button edits in `site-header.tsx`] → Edit only the `SessionControl` / `AccountMenu` region, and leave those hunks alone.

## Testing strategy

- **Vitest component + RTL** (`src/components/site-header/site-header.test.tsx`): mirror the existing "GIVEN no session WHEN the account trigger is opened THEN its menu offers Sign in" test. Open the trigger with `userEvent` and assert that the menu items are exactly `signIn` then `signUp`, with `signUp` linking to `/sign-up`. The existing "Sign out" case already covers the session-without-card menu. Tighten it so that `signUp` is absent there.
- **Vitest unit** (`src/messages/messages.test.ts`): already checks that key sets match across locales, so a missing `signUp` in any locale fails it. No new test is needed.
- **Playwright**: no new e2e. Nothing in `e2e/` drives the phone account menu, and RTL covers the behaviour. The browser check is visual: open the menu at a phone width.
