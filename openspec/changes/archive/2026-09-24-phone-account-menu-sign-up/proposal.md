## Why

On a phone, a visitor without a session sees the account control only as an icon, and opening it offers **Sign in** alone. A newcomer, the visitor the signed-out header is there for, has no path to creating an account from the header. They have to open Sign in first and find the "Create an account" link under the form. The menu already exists and has room, so the second action costs nothing in header width.

## What Changes

- The phone account menu (the icon trigger below `sm`) for a visitor **without a session** offers two items: **Sign in** followed by **Create account**. **Create account** navigates to the sign-up route for the active locale.
- A new `SiteHeader.signUp` message is added in `en`, `es` and `pt` ("Create account" / "Crear cuenta" / "Criar conta").
- Everything else about the header stays as it is.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cinema-home`: the "Global header shows brand and section chrome" requirement. Without a session, the phone account menu now holds Sign in **and** Create account. Before, it held only the one action the desktop control spells out.

## Non-goals

- The desktop (`sm` and up) header is unchanged. It keeps the single spelled-out **Sign in** link and gets no Create account link, because the header row there was measured around one label.
- The signed-in states are unchanged. That covers the learner's avatar menu and the phone menu for a session with no learner card, which still offers only **Sign out**.
- The sign-in and sign-up pages, and the cross-links between them, are unchanged.
- The trigger's icon, accessible name ("Account menu") and chip styling are unchanged.

## Impact

- `src/components/site-header/site-header.tsx`: the signed-out branch of `SessionControl` adds a second `DropdownMenuItem`. The `AccountMenu` JSDoc stops saying "one account action".
- `src/components/site-header/site-header.test.tsx`: a new RTL case for the second item.
- `src/messages/{en,es,pt}.json`: the new `SiteHeader.signUp` key.
- No domain, adapter, route or dependency changes.
