## ADDED Requirements

### Requirement: The project exposes a shadcn `Dialog` primitive

The project SHALL provide a shadcn/ui `Dialog` primitive at
`src/components/ui/dialog/dialog.tsx`, following the folder-per-component rule.
It SHALL be built on the `radix-ui` unified package already used by
`button.tsx` (`import { Dialog as DialogPrimitive } from "radix-ui"`) and SHALL
NOT introduce a new dependency.

The module SHALL export `Dialog`, `DialogTrigger`, `DialogPortal`,
`DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`,
`DialogFooter`, `DialogTitle`, and `DialogDescription`. Every rendered element
SHALL carry a `data-slot` attribute (`dialog`, `dialog-overlay`,
`dialog-content`, `dialog-title`, …) so callers can style descendants without
reaching for class-name internals.

`DialogContent` SHALL render inside a portal, above a `DialogOverlay` backdrop,
and SHALL accept a `showCloseButton` prop defaulting to `true`.

#### Scenario: The primitive lives in the conventional location
- **WHEN** a developer imports `@/components/ui/dialog/dialog`
- **THEN** the `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription`,
  `DialogHeader`, `DialogFooter`, `DialogClose`, `DialogOverlay`,
  `DialogPortal`, and `DialogTrigger` exports resolve

#### Scenario: Open content is portalled above a backdrop
- **WHEN** a `Dialog` is rendered with `open` set to `true`
- **THEN** an element with `data-slot="dialog-overlay"` and an element with
  `data-slot="dialog-content"` are present in the document, outside the DOM
  subtree of the component that rendered the `Dialog`

#### Scenario: The close button can be suppressed
- **WHEN** a `DialogContent` is rendered with `showCloseButton` set to `false`
- **THEN** no close button is rendered inside the content

### Requirement: The `Dialog` primitive is accessible by construction

An open `DialogContent` SHALL expose `role="dialog"`, SHALL trap keyboard focus
inside the content while open, and SHALL close on `Escape` and on a click of the
overlay.

Modality SHALL be enforced by marking every element outside the dialog content
`aria-hidden="true"` for as long as it is open, so assistive technology cannot
reach the page behind it. The primitive SHALL NOT rely on `aria-modal` alone:
`aria-modal` is unevenly supported and, on its own, leaves background content
reachable in several screen readers.

Every `DialogContent` SHALL be labelled by a `DialogTitle` and described by a
`DialogDescription`. When a design calls for no visible title, the `DialogTitle`
SHALL still be rendered and visually hidden — it SHALL NOT be omitted.

#### Scenario: The dialog announces itself
- **WHEN** a `Dialog` is open
- **THEN** the content element has `role="dialog"`, its accessible name comes
  from the rendered `DialogTitle`, and its accessible description comes from the
  rendered `DialogDescription`

#### Scenario: The page behind the dialog is hidden from assistive technology
- **WHEN** a `Dialog` is open
- **THEN** every sibling element of the dialog content, including the overlay,
  carries `aria-hidden="true"`, and the dialog content itself does not

#### Scenario: Escape closes the dialog
- **WHEN** the learner presses `Escape` while a `Dialog` is open
- **THEN** `onOpenChange` is called with `false` and the content is removed
  from the document

#### Scenario: Clicking the backdrop closes the dialog
- **WHEN** the learner clicks the `dialog-overlay` element
- **THEN** `onOpenChange` is called with `false`

### Requirement: The `Dialog` primitive is themed on the project's own tokens

The primitive SHALL be styled with the project's design tokens — `border`,
`bg-card`/`bg-background`, `text-foreground`, `ring`, and the shared radius
scale — rather than shipping stock shadcn neutral values. Its visual weight
SHALL match the Immersion Cinema surfaces already used by `bg-card` panels
elsewhere in the app.

The close affordance's `sr-only` label SHALL come from `next-intl` under the
`Components.Dialog` namespace and SHALL be present in every locale
(`en`, `es`, `pt`). No user-facing string in the primitive SHALL be hardcoded.

#### Scenario: The content surface uses project tokens
- **WHEN** `DialogContent` renders
- **THEN** its class list references the project's token-backed utilities
  (`bg-card` or `bg-background`, `border-border`, `text-foreground`) and not
  hardcoded palette values

#### Scenario: The close button is localized
- **WHEN** `DialogContent` renders its default close button
- **THEN** the button's accessible name is read from the
  `Components.Dialog.closeLabel` translation key, which resolves in `en`, `es`,
  and `pt`

### Requirement: Modals are triggered imperatively through NiceModal

Every modal in the application SHALL be declared as a `NiceModal.create(...)`
component under `src/components/modals/<name>/<name>.tsx` and SHALL render its
UI with the `Dialog` primitive. Callers SHALL open it with
`NiceModal.show(...)` rather than by prop-drilling an `open` boolean or
conditionally rendering the modal as a child.

The modal component SHALL bind `Dialog`'s `open` to `modal.visible` and
`onOpenChange` to `modal.hide`, and SHALL call `modal.remove()` once the
dialog has closed so the portal is torn down.

Every modal SHALL resolve its promise exactly once — with the learner's choice
when they act, and with a defined "dismissed" result when they close it without
choosing — so `await NiceModal.show(...)` never hangs.

#### Scenario: A modal opens without being rendered by the caller
- **WHEN** a component calls `NiceModal.show(SomeModal, props)`
- **THEN** the modal appears in the document even though the calling component
  renders no modal element in its own tree

#### Scenario: Dismissal still resolves the caller
- **WHEN** the learner closes a NiceModal-driven dialog with `Escape`, the
  overlay, or the close button, without picking an action
- **THEN** the promise returned by `NiceModal.show(...)` resolves with the
  modal's defined dismissal result rather than remaining pending
