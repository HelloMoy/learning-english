# Capability: course-vocabulary

## Purpose

Fix the user-facing naming of course content so that each term denotes exactly one level of the hierarchy — Course, then Lesson (domain `Module`), then Video (domain `Lesson`) — across every surface and every locale.

This exists because the product previously used one word for two levels: `Episode` counted modules on the course overview and labelled lessons on the module overview, so a learner who opened "episode 3" landed on a list restarting at "Episode 1". The contradiction sat on the exact navigation step where it did the most damage. Owning the vocabulary as a capability, with tests over the message catalogues, is what keeps that regression from returning.

This capability governs presentation strings only. Domain type names (`Module`, `Lesson`) are deliberately untouched.
## Requirements
### Requirement: Course content uses one unambiguous term per level

Every user-facing surface SHALL name course content with exactly three terms, each denoting exactly one level of the hierarchy:

| Domain type | User-facing term | Ordinal form |
| --- | --- | --- |
| `Course` | course / curso / curso | — |
| `Module` | lesson / lección / lição | `Lesson N` |
| `Lesson` | video / video / vídeo | `Video N` |

A term SHALL NOT denote different levels on different routes. The words `Season`, `Episode` and the standalone `Module` badge SHALL NOT appear in any user-facing string, because `Episode` previously denoted a `Module` on the course overview and a `Lesson` on the module overview.

Domain type names are unaffected: `Module` and `Lesson` remain the entity names in `src/domain/**`. This requirement governs presentation strings only — the message catalogues in `src/messages/` and the components that read them.

#### Scenario: The same word never denotes two levels
- **WHEN** a learner moves from the course overview to a module overview to a lesson page
- **THEN** each term they encounter refers to the same level of the hierarchy throughout, and no term denotes a `Module` on one route and a `Lesson` on another

#### Scenario: The retired terms are gone
- **WHEN** any course, module or lesson surface renders in any supported locale
- **THEN** no user-facing string contains `Season`, `Temporada`, `Episode`, `Episodio`, `Episódio`, or a bare `Module` badge

#### Scenario: A module's children are counted as videos
- **WHEN** a surface states how much content a module holds
- **THEN** it counts its `Lesson` children as videos — for example `6 videos` — and never as episodes or lessons

### Requirement: Course vocabulary is localized across all supported locales

Every vocabulary term SHALL be defined in each supported locale catalogue (`src/messages/en.json`, `es.json`, `pt.json`) with matching message keys, so no surface falls back to a missing key or an untranslated term.

#### Scenario: All three catalogues define the same keys
- **WHEN** the message catalogues are compared
- **THEN** each vocabulary key present in one locale is present in all of them

#### Scenario: Copy renders in the active locale
- **WHEN** the active locale is `es` or `pt`
- **THEN** the ordinal labels, count lines and calls to action render from that locale's catalogue rather than from English

### Requirement: Content ordering is stated, not implied

Where a surface lists modules or lessons **as text**, it SHALL render them in `sequence` order and SHALL expose each item's ordinal as text (`Lesson N`, `Video N`), so ordering survives truncation of the accompanying title.

Purely decorative artwork is exempt: a surface may show lesson thumbnails without labels, provided it neither names nor enumerates them and the information is carried in text elsewhere on that surface.

This exists because lesson titles in real content are not self-ordering: they range from 5 to 50 characters, and in the largest modules they share a long common prefix whose only distinguishing token is a trailing number that any truncation removes.

#### Scenario: Ordinals survive title truncation
- **WHEN** a surface truncates a lesson title to fit its layout
- **THEN** the item's ordinal remains fully visible, because it is rendered outside the truncated title

#### Scenario: Items render in sequence order
- **WHEN** modules or lessons are listed
- **THEN** they appear in ascending `sequence` order and their displayed ordinals ascend with them

