# ui-menu-primitive Specification

## Purpose
TBD - created by archiving change mobile-viewport-fit. Update Purpose after archive.
## Requirements
### Requirement: The project exposes a shadcn `DropdownMenu` primitive

The project SHALL provide a shadcn/ui `DropdownMenu` primitive at `src/components/ui/dropdown-menu/dropdown-menu.tsx`, following the folder-per-component rule. It SHALL be built on the `radix-ui` unified package already used by `button.tsx` and `dialog.tsx` (`import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"`) and SHALL NOT introduce a new dependency.

The module SHALL export `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuPortal`, `DropdownMenuContent`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, and `DropdownMenuItemIndicator`. Every rendered element SHALL carry a `data-slot` attribute (`dropdown-menu`, `dropdown-menu-trigger`, `dropdown-menu-content`, `dropdown-menu-radio-item`, …) so callers can style descendants without reaching for class-name internals.

The primitive SHALL be scoped to single-choice menus. Sub-menus, checkbox items, group labels, separators, and shortcut slots SHALL NOT be ported until a consumer needs them; shipping the full registry surface for one consumer is speculative generality.

`DropdownMenuContent` SHALL render inside a portal, so a menu opened from inside a clipped or transformed ancestor is not cut off by it.

#### Scenario: The primitive lives in the conventional location
- **WHEN** a developer imports `@/components/ui/dropdown-menu/dropdown-menu`
- **THEN** the `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuPortal`, `DropdownMenuContent`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, and `DropdownMenuItemIndicator` exports resolve

#### Scenario: Open content is portalled
- **WHEN** a `DropdownMenu` is opened
- **THEN** an element with `data-slot="dropdown-menu-content"` is present in the document, outside the DOM subtree of the component that rendered the menu

#### Scenario: The unported surface stays unported
- **WHEN** the primitive module is inspected
- **THEN** it exports no sub-menu, checkbox-item, label, separator, or shortcut components

### Requirement: The `DropdownMenu` primitive is accessible by construction

An open `DropdownMenuContent` SHALL expose `role="menu"`, and each option rendered as a `DropdownMenuRadioItem` SHALL expose `role="menuitemradio"` with its checked state reflected in `aria-checked`.

The menu SHALL be fully operable by keyboard: arrow keys SHALL move focus between items, `Escape` SHALL dismiss the menu, and focus SHALL return to the trigger when the menu closes. The trigger SHALL expose its expanded state through `aria-expanded`.

Exactly one item in a `DropdownMenuRadioGroup` SHALL be checked at a time, reflecting the group's current value.

#### Scenario: The menu announces itself
- **WHEN** a `DropdownMenu` is open
- **THEN** the content element has `role="menu"` and each of its radio options has `role="menuitemradio"`

#### Scenario: The current choice is marked
- **WHEN** a `DropdownMenuRadioGroup` renders with a value matching one of its items
- **THEN** that item reports `aria-checked="true"` and every sibling item reports `aria-checked="false"`

#### Scenario: Escape dismisses and restores focus
- **WHEN** the user presses `Escape` while the menu is open
- **THEN** the content is removed from the document and focus returns to the trigger

#### Scenario: The trigger reports its state
- **WHEN** the menu is closed and then opened
- **THEN** the trigger's `aria-expanded` reads `false` and then `true`

### Requirement: The `DropdownMenu` primitive is themed on the project's own tokens

The primitive SHALL be styled with the project's design tokens — `border-border`, `bg-card`/`bg-popover`, `text-foreground`, `ring`, and the shared radius scale — rather than shipping stock shadcn neutral values, so a menu reads as part of the Immersion Cinema surface family alongside the dialog and the outline panels.

No user-facing string SHALL be hardcoded in the primitive. The primitive renders only what its caller passes; any label, name, or description belongs to the composing component and comes from `next-intl`.

#### Scenario: The menu surface uses project tokens
- **WHEN** `DropdownMenuContent` renders
- **THEN** its class list references the project's token-backed utilities (`bg-popover` or `bg-card`, `border-border`, `text-foreground`) and not hardcoded palette values

#### Scenario: The primitive ships no copy of its own
- **WHEN** the primitive module is inspected
- **THEN** it contains no user-facing literal string; all visible text arrives from the caller

