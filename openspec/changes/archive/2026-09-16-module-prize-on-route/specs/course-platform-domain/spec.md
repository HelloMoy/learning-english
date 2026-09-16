## ADDED Requirements

### Requirement: `findModuleForView` names the next lesson that holds videos

`findModuleForView({ courseSlug, moduleSlug })` SHALL also resolve the module that follows the requested
one in the course: the first module after it in `sequence` order that holds at least one lesson, together
with that module's lessons in `sequence` order. When no later module holds lessons, the result SHALL
carry no next module rather than an empty one. Resolving it SHALL NOT add a lesson repository call: the
use case already lists the course's lessons.

#### Scenario: The next module is resolved with its lessons
- **WHEN** `mod-1` is requested and `mod-2`, the next module in sequence, holds lesson C
- **THEN** the result names `mod-2` as the next module with lesson C as its lessons

#### Scenario: An empty module is skipped
- **WHEN** `mod-1` is requested, `mod-2` holds no lessons and `mod-3` holds lesson D
- **THEN** the result names `mod-3` as the next module

#### Scenario: The last module has no next module
- **WHEN** the last module of the course holding lessons is requested
- **THEN** the result carries no next module

#### Scenario: Lessons are still listed once
- **WHEN** the use case runs against instrumented repositories
- **THEN** it calls `LessonRepository.listByCourse` exactly once
