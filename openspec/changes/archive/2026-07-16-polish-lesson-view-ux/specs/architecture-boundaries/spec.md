# Delta Spec — architecture-boundaries

This is a delta spec on top of the capability defined in
`openspec/specs/architecture-boundaries/spec.md`. The polish change adds a
runtime requirement that no architectural-bypass warning leaks to the browser
console. The full text of the prior spec is the baseline; `## ADDED
Requirements` introduces the new behaviour.

## ADDED Requirements

### Requirement: The `next-themes` warning is acknowledged in the codebase

The application uses `next-themes` for theme management. `next-themes@0.4.6`
emits a React 19 console warning of the form
`"Encountered a script tag while rendering React component"` because its
`<ThemeProvider>` injects a FOUC-prevention `<script>` via
`React.createElement("script", { dangerouslySetInnerHTML })`. The codebase
SHALL acknowledge this warning in the source code (a JSDoc note on the
theme consumer) and SHALL NOT replace the provider with a custom
re-implementation. The warning is non-blocking and is tracked upstream
in the `next-themes` repository for the post-0.4 series.

#### Scenario: The theme consumer's source file documents the warning
- **WHEN** a developer reads `src/components/theme-toggle/theme-toggle.tsx`
- **THEN** the file's JSDoc explains that `next-themes@0.4.6` emits a React 19 warning, and references the rationale in `openspec/changes/polish-lesson-view-ux/design.md` §D6

#### Scenario: All routes remain functional despite the warning
- **WHEN** a user visits any route in the application
- **THEN** navigation, theme toggling, and lesson-page flows work as specified; the warning does not prevent interaction or render any region incorrectly