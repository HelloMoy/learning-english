## ADDED Requirements

### Requirement: A `Skeleton` primitive exists as an unmodified shadcn copy-in

The project SHALL vendor shadcn's `Skeleton` component through
`pnpm dlx shadcn@latest add skeleton` and SHALL place it at
`src/components/ui/skeleton/skeleton.tsx`, matching the folder-per-component layout every
other `ui` primitive follows. Its rendered output SHALL remain the primitive's own — a
single `div` carrying the pulse animation, the rounded corners and the muted fill from the
theme tokens — with no bespoke shimmer CSS added alongside it.

The component SHALL accept and merge a `className`, so every placeholder in the app is
composed by sizing and positioning this one primitive rather than by writing new animated
elements.

#### Scenario: The primitive renders a decorative block
- **WHEN** `Skeleton` is rendered with no props
- **THEN** it renders a single element carrying the pulse animation and the theme's muted fill

#### Scenario: Callers shape the primitive through `className`
- **WHEN** `Skeleton` is rendered with a `className` that sets a size
- **THEN** that class is merged onto the rendered element alongside the primitive's own classes

### Requirement: The `Skeleton` primitive is invisible to assistive technology

A `Skeleton` SHALL carry no accessible name, no role and no text content, so a screen
reader encounters nothing where a placeholder sits. Announcing that something is loading
SHALL be the job of the one live region its containing shell owns, never of the individual
shapes — a lesson shell built from a dozen skeletons must announce "loading" once, not
twelve times.

#### Scenario: A placeholder announces nothing on its own
- **WHEN** a `Skeleton` is rendered inside a shell
- **THEN** it exposes no role and no accessible name to assistive technology

### Requirement: The `Skeleton` primitive ships with the artifacts every reusable component requires

`Skeleton` SHALL ship with colocated stories (`skeleton.stories.tsx`) under the `UI/`
Storybook prefix, colocated tests (`skeleton.test.tsx`), and JSDoc on the component and
its props. Because it renders no user-facing string, it SHALL introduce no translation
keys; any copy its stories need SHALL live in `.storybook/messages/*` under `Stories.*`.

#### Scenario: The primitive is documented and covered
- **WHEN** the change is complete
- **THEN** `src/components/ui/skeleton/` contains the component, its stories and its tests, and the component carries JSDoc

#### Scenario: The primitive adds no production translation keys
- **WHEN** the primitive is reviewed against `src/messages/{en,es,pt}.json`
- **THEN** no `Components.Skeleton` namespace is required, because the primitive renders no copy
