## Why

On a phone, "Contenido del curso" is today a bare `<details>` strip above the breadcrumb: a
gold uppercase label and nothing else. It names the region but answers none of the questions a
learner arriving on a lesson actually has — *how far along am I?*, *which module is this?*,
*how many lessons are left?* — and it competes with the video for the top of the viewport,
the most valuable space on a small screen.

Three candidate presentations exist as design mockups. Choosing between them from static images
is guesswork: the difference is in how each one *feels* under a thumb on a real phone — whether
the bottom sheet is reachable, whether the progress card pushes the player below the fold,
whether the compact row reads as tappable. This change ships all three behind a URL switch so
the decision is made by using them, then keeps exactly one.

## What Changes

- A new **provisional variant switch** on the Lesson Page: the search param `?outline=a|b|c`
  selects which mobile presentation of the course outline renders. Any other value, or no
  param at all, renders today's `<details>` drawer unchanged.
- Three new mobile presentations of the course outline, each opening the **same existing
  `Outline`** — none of them forks the lesson list, the completion marks, or the
  scroll-the-current-lesson-into-view behavior:
  - **Variant A — progress card.** A card above the breadcrumb carrying a per-module segmented
    meter, the course-completion percentage as a large numeral, `Module · Lesson N of M`, and a
    "View content" disclosure toggle.
  - **Variant B — compact row.** A single-row card: a gold icon tile, the title, the
    `Module · Lesson N of M` subtitle, a chevron, and a thin completion meter along the card's
    bottom edge.
  - **Variant C — bottom sheet.** A bar docked to the bottom edge of the viewport — grab handle,
    gold icon, title, `N / M` counter, upward chevron — that expands into the outline.
    **This variant removes the top card entirely**, so the breadcrumb runs straight into the player.
- Two new pieces of course-level progress the variants read, computed in the browser from the
  stores that already back the outline's completion marks, so a variant's meter can never
  disagree with the rows it opens onto.
- New localized copy for the variants' labels and counters, in `en`, `es` and `pt`.

**Not breaking.** The default path — no search param — is byte-for-byte today's behavior, and
the desktop (`>= lg`) sticky sidebar is untouched in all three variants.

## Capabilities

### New Capabilities

- `mobile-course-content-variants`: the provisional search-param switch, the three mobile
  presentations of the course outline, the course-level progress reading they display, and the
  guarantee that the unswitched default and the desktop sidebar are unaffected. Deliberately a
  **separate, disposable capability**: the chosen variant graduates into `cinema-lesson-view`
  in a follow-up change, and archiving this one is then a clean delete rather than an unpick.

### Modified Capabilities

<!-- None. Every existing requirement in `cinema-lesson-view` — including the mobile drawer's
     `<summary>` label and its open-onto-the-current-lesson positioning — continues to hold on
     the default path, and each variant reuses the same `Outline` and the same positioning
     rather than restating them. -->

## Non-goals

- **Picking a winner.** This change ends with three things to try, not with one chosen. Removing
  the two losers and folding the winner into `cinema-lesson-view` is a separate change.
- **Changing the desktop layout.** The `>= lg` sticky sidebar keeps its current markup,
  behavior, and spec.
- **Changing the `Outline` itself.** The module disclosures, lesson rows, completion marks,
  per-lesson meters, and current-lesson positioning are reused as they are.
- **Persisting the choice.** The param is read from the URL each visit; nothing is written to
  `localStorage`, no cookie, no user setting.
- **Production discoverability.** Nothing in the UI links to `?outline=…`. It is typed by hand
  by the person evaluating it, and search engines are not invited to index the variants.
- **A drag-to-dismiss gesture on Variant C.** Its grab handle is an affordance the mockup shows;
  the sheet opens and closes by tap. A real drag is a separate concern and would prejudge the
  comparison by giving one variant an interaction the others lack.
- **Touching the in-flight `hold-to-speed-up-playback` work** sharing this working tree.

## Impact

**New code**

- `src/components/lesson-view/outline-variant-*/` — one folder per variant, each with its
  component, stories, and tests.
- `src/hooks/use-course-watch-progress/` — completed-lesson count and completion fraction for a
  whole course, built on the same `countsAsComplete` rule the outline's marks use.
- `src/lib/lesson-position/` — where the current lesson sits inside its module (`N of M`).

**Modified code**

- `src/components/lesson-view/outline-drawer/outline-drawer.tsx` — reads the param and dispatches
  to a variant, or falls through to today's `<details>`. The desktop `<aside>` branch is untouched.
- `src/messages/{en,es,pt}.json` — new keys under `Components.Outline`.

**Dependencies** — none added. `nuqs` is already a dependency with `<NuqsAdapter>` mounted in
`src/components/global-providers.tsx`, and `lucide-react` already supplies the icons.

**Constraint inherited from `watch-progress`** — progress lives in `localStorage`, so no variant
may render a meter or a percentage in its server-rendered first frame. A bar drawn at zero before
hydration asserts the learner has watched nothing, which may be false.

**Removal** — this change is provisional by construction. Every file it adds is either deleted or
promoted by the follow-up change; nothing else in the codebase depends on the `outline` param.
