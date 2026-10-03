## Context

`README.md` is the `create-next-app` scaffold plus two sections added later
(Storybook, TypeDoc). The chosen design, "A · Marquesina", was drawn on a design
canvas as HTML and CSS. GitHub renders a README from sanitized Markdown: no
`<style>`, no `style` attributes, no inline `<svg>`, no scripts. Whatever needs
the Immersion Cinema look — the banner, the three buttons — has to be an image
file; everything else is plain Markdown that GitHub styles itself.

Repository-level documents already have guard tests under `src/deployment/`
(`release.test.ts`, `docs-portal.test.ts`, `deployment.test.ts`): each reads a
file from the repository root and fails when it stops telling the truth.

## Goals / Non-Goals

**Goals:**

- The front page says what English Course is and links to production, the
  develop preview and the docs portal before anything else.
- The README cannot quietly drift from the repository.
- Editing an address is a text edit, with a test that catches a half-done one.

**Non-Goals:**

- Pixel parity with the canvas mock. The canvas set type in Geist; the README
  cannot (see the first decision).
- Any tooling: no generator script, no dependency, no `package.json` change.

## Decisions

### The images are hand-authored SVG with real text in system fonts

Each image is a small SVG file with `<text>` elements and a system font stack
(`system-ui, -apple-system, "Segoe UI", …` and `ui-monospace, SFMono-Regular,
Menlo, Consolas, …`).

- _Why:_ the address a button shows is then text inside the file. Changing a
  domain is a one-line edit, and a test can assert that the painted host equals
  the linked host. The files are a few kilobytes and sharp at any zoom.
- _Alternative — Geist converted to outlines:_ exact brand type, but it needs a
  font-outlining dependency and a generator, and the painted address becomes
  path data no test can read. This is the look the canvas showed; it is a
  possible follow-up if the system-font result is not close enough.
- _Alternative — PNG rendered with Playwright:_ exact brand type with no new
  dependency, but raster, an order of magnitude heavier, needs a generator
  script, and has the same unreadable-address problem.
- _Alternative — Geist embedded in the SVG as a data URI:_ not relied on. GitHub
  serves repository images under a restrictive content security policy, and an
  image that silently falls back to another font is worse than one designed for
  system fonts from the start.

Because text width now varies by platform, the banner is laid out with slack:
the headline is broken into three fixed lines whose widest fits its column in
the widest common system face, and nothing is positioned relative to the end of
a text run.

### Buttons have a fixed width, not a percentage

Each button is 260 px wide. Three fit side by side in the README column on a
desktop; on a phone they wrap to one per line and stay legible. A percentage
width would keep them in a row on a phone at a third of the screen each, with an
unreadable address.

### Images live in `.github/assets/readme/` and are referenced relatively

`.github/` is already the home for repository plumbing, and a relative path
renders on any branch or fork. Links to repository documents are relative for
the same reason.

### Badges come from shields.io in the marquee colours

GitHub's native workflow badge cannot be recoloured. shields.io reads the same
public workflow and release status and takes `labelColor` and `color`. Each
badge links to what it reports (the workflow's runs, the releases page). The
workflow badges read `develop`, the branch every pull request lands on.

### The Storybook and TypeDoc sections move behind the docs portal link

Both are published at `docs.english-course.online` now. The README keeps one
sentence naming the local commands and lets `AGENTS.md` carry the conventions,
which it already does in full.

## Testing strategy

One layer: **Vitest unit, node environment** — `src/deployment/readme.test.ts`,
mirroring `src/deployment/release.test.ts` (read files from the repository root
with `readFileSync`, assert on their text). It covers every scenario in the
`repo-readme` spec:

- the three addresses appear as image links, in order, and again as text links;
- the develop row mentions Vercel sign-in;
- every repository-path image exists and has alt text;
- each button's SVG contains its link's host, and so does its alt text;
- every `pnpm <script>` named exists in `package.json`;
- every relative link target exists;
- `create-next-app` does not appear.

No component test and no Playwright spec: nothing here runs in the app. The
rendered result is checked once by hand during apply — GitHub's own Markdown
renderer (`gh api markdown`) produces the HTML, and a browser screenshot of that
page with the local images confirms the layout on desktop and phone widths.

## Risks / Trade-offs

- [System fonts differ from Geist, and from each other] → The layout leaves
  slack for the widest face; the brand reads through colour, the wordmark's
  spacing and the _ship / sheep_ motif. Outlined Geist stays available as a
  follow-up.
- [shields.io is a third party and can be slow or down] → A badge that fails to
  load shows its alt text; nothing else on the page depends on it.
- [A gold badge does not turn red when CI fails] → The badge text still reads
  "failing". Accepted for a consistent palette.
- [The develop link sends outsiders to a Vercel login] → The button is kept, as
  designed, and the Environments table says why.

## Open Questions

- None blocking. The repository's _About_ panel still points at the old
  `vercel.app` address; updating it is a manual GitHub setting.
