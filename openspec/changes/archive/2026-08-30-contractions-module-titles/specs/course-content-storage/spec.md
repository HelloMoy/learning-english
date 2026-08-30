## MODIFIED Requirements

### Requirement: Lesson titles come from the notes heading for allowlisted modules

The generator SHALL derive a lesson's title from the first Markdown `#` heading of that lesson's `readme.md`, but only for modules named in an explicit, reviewed allowlist. For every module not in that allowlist, the title SHALL continue to be derived from the lesson slug, unchanged.

The allowlist SHALL be per-module, not per-lesson, and SHALL live in its own reviewed file alongside the slug overrides, so enabling a module is a single visible edit.

The heading SHALL be adopted only when it carries information the slug could not: if the heading equals the slug-derived title ignoring case, the slug-derived title SHALL be kept. A lesson whose `readme.md` is absent, or whose `readme.md` has no `#` heading, SHALL keep the slug-derived title.

The generator SHALL additionally consult a reviewed per-lesson title override table, keyed by the full `courseSlug/moduleSlug/lessonSlug` path. An override SHALL take precedence over both the heading and the slug, and SHALL apply whether or not its module is in the allowlist — it is already a per-lesson reviewed decision. The override table exists for lessons whose real name cannot be recovered automatically, such as a lesson with no `readme.md` at all.

The resolved title SHALL be applied once and used for both the lesson and its notes Resource, so the two can never disagree.

When a title is adopted from a heading, apostrophes SHALL be normalized to `’` (U+2019), so a module reads consistently regardless of which character its author typed. No other normalization SHALL be applied — not case, not punctuation spacing, not `&`/`and`. Override values SHALL be written correctly rather than normalized.

These rules SHALL apply to both video and reading lessons.

Reading the heading SHALL NOT change how lessons are classified, how slugs, sequences, ids, posters or resources are derived, or the contents of the notes Resource.

#### Scenario: A heading recovers notation the slug lost
- **WHEN** a lesson in an allowlisted module sits in a folder slugged `4-fast` and its `readme.md` opens with `# Fast /æ/`
- **THEN** the emitted lesson's title is `Fast /æ/`, not `Fast`

#### Scenario: Sibling folders that slugged identically become distinguishable
- **WHEN** several lessons in an allowlisted module occupy folders that all slug to the same human name, and each `readme.md` opens with a different heading
- **THEN** each emitted lesson carries its own heading as its title, so no two rows in the module display the same name

#### Scenario: A module outside the allowlist is untouched
- **WHEN** a lesson in a module absent from the allowlist has a `readme.md` whose heading differs from the slug-derived title
- **THEN** the emitted title is the slug-derived one, and the generated seed for that module is unchanged

#### Scenario: A heading that differs only in case is not adopted
- **WHEN** a lesson in an allowlisted module has the slug-derived title `Intro` and its `readme.md` opens with `# INTRO`
- **THEN** the emitted title remains `Intro`, because capitalization is not information the slug lost

#### Scenario: A lesson with no heading keeps the slug-derived title
- **WHEN** a lesson in an allowlisted module has no `readme.md`, or has one with no `#` heading
- **THEN** the emitted title is the slug-derived one and no error is raised

#### Scenario: An override supplies a title no automatic source can produce
- **WHEN** a lesson has no `readme.md`, so neither a heading nor anything but the mangled slug is available, and the override table has an entry for its full slug path
- **THEN** the emitted title is the override value

#### Scenario: An override outranks a heading
- **WHEN** a lesson in an allowlisted module has both a `readme.md` heading and an override entry
- **THEN** the override value wins, because it is the more specific reviewed decision

#### Scenario: The override reaches the notes Resource too
- **WHEN** an overridden lesson also emits a notes Resource
- **THEN** that Resource is titled from the same resolved title, so the lesson and its notes never show different names

#### Scenario: Apostrophes in an adopted heading are normalized
- **WHEN** one lesson's heading uses `'` (U+0027) and a sibling's uses `’` (U+2019)
- **THEN** both emitted titles use `’`, so the module does not mix the two characters

#### Scenario: Normalization does not reach beyond apostrophes
- **WHEN** an adopted heading contains mixed case, an ampersand, or irregular spacing around punctuation
- **THEN** those are emitted unchanged — only the apostrophe character is normalized

#### Scenario: Lesson identity survives a title change
- **WHEN** the generator is re-run after enabling a module or adding an override, and titles change
- **THEN** every lesson's id, slug, sequence, `source` and `poster` are unchanged, because ids are derived from the course, module and lesson slugs and never from the title
