## MODIFIED Requirements

### Requirement: `BrowserLocalStorageProgressTracker` persists completion in `localStorage`

The `BrowserLocalStorageProgressTracker` adapter SHALL implement the existing `ProgressTracker` port by reading and writing `window.localStorage` under the key namespace `learning-english:completed:{lessonId}`, where `{lessonId}` is the lesson identifier verbatim. The presence of the key SHALL mean the lesson is complete and its absence SHALL mean it is not; there SHALL be no third state.

The adapter SHALL also implement `unmarkComplete(lessonId)`, which removes that same
key. Removing a key that is not present SHALL succeed and leave the lesson incomplete,
so un-marking is idempotent in the way marking already is.

The adapter SHALL guard against `window.localStorage` being `undefined` (SSR, tests, restricted environments) by treating any read as "not complete" and any write as a no-op, without throwing. A write that the browser rejects (quota exceeded, storage blocked) SHALL NOT propagate an exception to the caller.

The adapter SHALL be browser-only and MUST NOT be imported from Server Components, Server Actions, or the server dependency graph, which continues to bind `InMemoryProgressTracker`.

#### Scenario: A completed lesson round-trips
- **WHEN** `markComplete(lessonId)` is called and the same browser session then calls `isComplete(lessonId)`
- **THEN** `isComplete(lessonId)` resolves to `true`

#### Scenario: An unmarked lesson reads as incomplete
- **WHEN** `isComplete(lessonId)` is called for a lesson that was never marked
- **THEN** it resolves to `false`

#### Scenario: An un-marked lesson reads as incomplete again
- **WHEN** `markComplete(lessonId)` is called and the same browser session then calls `unmarkComplete(lessonId)`
- **THEN** `isComplete(lessonId)` resolves to `false`

#### Scenario: Un-marking is idempotent
- **WHEN** `unmarkComplete(lessonId)` is called for a lesson that was never marked
- **THEN** it resolves without throwing and `isComplete(lessonId)` still resolves to `false`

#### Scenario: Un-marking one lesson leaves the others alone
- **WHEN** two lessons are marked complete and `unmarkComplete` is called for one of them
- **THEN** the other lesson is still reported complete

#### Scenario: Marking is idempotent
- **WHEN** `markComplete(lessonId)` is called twice for the same lesson
- **THEN** the second call succeeds and `isComplete(lessonId)` still resolves to `true`

#### Scenario: Lessons are isolated
- **WHEN** `markComplete(lessonA)` is called and then `isComplete(lessonB)` is called for a different lesson
- **THEN** `isComplete(lessonB)` resolves to `false`

#### Scenario: The adapter no-ops when `localStorage` is unavailable
- **WHEN** the adapter is constructed in an environment where `window` or `window.localStorage` is `undefined`
- **THEN** `isComplete` resolves to `false`, and `markComplete` and `unmarkComplete` both resolve without throwing

#### Scenario: A rejected write does not break the caller
- **WHEN** the underlying `Storage.setItem` or `Storage.removeItem` throws (for example, quota exceeded or storage blocked)
- **THEN** `markComplete` and `unmarkComplete` resolve without propagating the exception

### Requirement: The client reads completion through a single composition root

The browser SHALL read completion through one client-side composition root — the only place permitted to name the concrete browser adapter — mirroring the role `usePlaybackPosition` plays for playback and `getCoursePlatformDeps` plays on the server. Components SHALL NOT read `window.localStorage` directly.

The composition root SHALL be the only place that writes completion too — both the
mark and the un-mark — so no component reaches the adapter or `window.localStorage` to
clear a mark either.

The composition root SHALL expose a single shared snapshot, so that every surface showing completion agrees at any moment and a lesson marked on one surface is immediately reflected on another rendered at the same time.

#### Scenario: Components never touch storage directly
- **WHEN** any component needs to know whether a lesson is complete
- **THEN** it obtains that through the composition root; it never reads `window.localStorage`, `document.cookie`, or any browser storage API directly

#### Scenario: Surfaces agree with one another
- **WHEN** a lesson is marked complete while both the outline and a completion indicator for that lesson are rendered
- **THEN** both reflect the new state without requiring a reload

#### Scenario: Surfaces agree when a mark is removed
- **WHEN** a lesson is un-marked while those same surfaces are rendered
- **THEN** both stop showing it as complete without requiring a reload, through the same shared snapshot

### Requirement: Completion and playback position remain independent

A saved playback position below the lesson's finish threshold SHALL NOT mark the
lesson complete, and marking a lesson complete SHALL NOT alter or clear its saved
playback position.

Completion has two producers, both writing the same key through the same
`ProgressTracker` port: the manual **Mark as complete** button, and playback crossing
the finish threshold defined by the `watch-progress` capability. There is one stored
notion of "done"; the finish rule is a second way of reaching it, not a second state.

A recorded completion SHALL NOT be cleared by any later playback: seeking backwards or
rewatching a completed lesson leaves it complete. The learner's own deliberate un-mark
is the only thing that clears it, and it SHALL NOT alter or clear the lesson's saved
playback position either — the two concepts stay independent in both directions.

Because the finish threshold is a second producer of completion, a lesson that was
un-marked and is then watched past that threshold SHALL be recorded complete again.
That is the existing rule applying unchanged, not a special case.

#### Scenario: Watching part of a lesson does not complete it
- **WHEN** a lesson has a saved playback position below its finish threshold and was never marked
- **THEN** it is reported as not complete

#### Scenario: Watching to the end completes it
- **WHEN** playback of a lesson crosses its finish threshold
- **THEN** the lesson is reported complete, through the same storage key the manual button writes

#### Scenario: Completing preserves the position
- **WHEN** a lesson with a saved playback position is marked complete
- **THEN** the saved position is unchanged and resuming still offers it

#### Scenario: Rewatching does not un-complete
- **WHEN** a completed lesson is replayed from the beginning
- **THEN** it is still reported complete

#### Scenario: Un-marking preserves the position
- **WHEN** a completed lesson with a saved playback position is un-marked
- **THEN** the saved position is unchanged and resuming still offers it

#### Scenario: Watching an un-marked lesson to the end completes it again
- **WHEN** a lesson is un-marked and playback then crosses its finish threshold
- **THEN** the lesson is reported complete again, through the same storage key
