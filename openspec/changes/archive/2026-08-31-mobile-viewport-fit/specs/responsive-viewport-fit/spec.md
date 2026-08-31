## ADDED Requirements

### Requirement: Every route fits the viewport width on phone-class viewports

Every route the application serves SHALL render its document no wider than the viewport at every phone-class viewport width, in every supported locale (`en`, `es`, `pt`), in both the light and dark themes. The routes in scope are the locale home (`/[locale]`), the course overview, the module overview, the lesson page, and the not-found pages.

"No wider than the viewport" means `document.documentElement.scrollWidth` SHALL NOT
exceed `document.documentElement.clientWidth`. Phone-class viewport widths are those
from 320px up to the `sm` breakpoint; 320px and 390px are the reference widths.

A view MAY still scroll a bounded region of its own horizontally — a code block, a wide
table, a media rail — provided that region carries its own `overflow-x` container and
the document itself does not scroll.

The requirement holds per locale because translated labels differ in length: the same
layout that fits in `en` can overflow in `es` or `pt`, and it is the longest translation
that governs.

#### Scenario: No route scrolls the document sideways on a phone
- **WHEN** any route is rendered at a 320px or 390px viewport width in any supported locale
- **THEN** `document.documentElement.scrollWidth` equals its `clientWidth`, so the page has no horizontal scroll

#### Scenario: The longest translation still fits
- **WHEN** a route is rendered at 320px under the locale whose labels are longest for that surface
- **THEN** the document still fits the viewport width, rather than fitting only in `en`

#### Scenario: A deliberately scrollable region does not leak to the document
- **WHEN** a view contains a region intended to scroll horizontally
- **THEN** the horizontal scroll is contained to that region and `document.documentElement.scrollWidth` still equals its `clientWidth`

### Requirement: Every control stays within reach on phone-class viewports

No interactive control SHALL be positioned outside the viewport's horizontal bounds on a
phone-class viewport. Every link, button, and form control that a view renders SHALL
have its bounding box fall within `[0, clientWidth]`, so a learner can reach it without
first scrolling the page sideways.

This holds for the shared layout chrome — the header's brand, locale switcher, and theme
toggle — as much as for the controls a view renders itself.

#### Scenario: Header controls are reachable on the narrowest phone
- **WHEN** any route is rendered at a 320px viewport width
- **THEN** the locale switcher and the theme toggle are both fully within the viewport and can be activated without horizontal scrolling

#### Scenario: No control is clipped off the right edge
- **WHEN** a route renders at a phone-class width in any supported locale
- **THEN** every interactive control's right edge is at or within the viewport's right edge

### Requirement: Background chrome covers the full document

The cinema background SHALL cover the full painted area of the document at every
viewport width, so no route shows an unpainted band beside its content.

#### Scenario: No unpainted band beside the content
- **WHEN** any route is rendered at a phone-class viewport width and scrolled to its full extent
- **THEN** the cinema background covers the content's full width, with no unpainted strip along any edge
