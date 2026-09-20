## 1. Schema

- [x] 1.1 Add `learner_profile`, `lesson_completion`, `playback_position` and `continue_watching` to the Drizzle schema, with `ON DELETE CASCADE` to `user`, and generate the migration. Integration test: the tables exist, and deleting a user empties all four for them (TDD: test → impl)

## 2. Turso adapters

- [x] 2.1 `TursoProgressTracker`: the port scenarios (round-trip, idempotent mark and un-mark, lesson isolation) plus learner isolation (TDD: test → impl)
- [x] 2.2 `TursoPlaybackPositionRepository`: round-trip, `null` when unsaved, one row per learner and lesson on repeated writes (TDD: test → impl)
- [x] 2.3 `TursoContinueWatchingRepository`: single slot per learner, `null` when empty or the row is unparsable (TDD: test → impl)
- [x] 2.4 `TursoLearnerProfileRepository`: round-trip, single slot, a corrupt row reads as `null` (TDD: test → impl)
- [x] 2.5 `createLearnerRepositories(db, learnerId)` and `loadLearnerSnapshot(db, learnerId)` (TDD: test → impl)

## 3. Server write path

- [x] 3.1 `learnerActionClient` in `src/lib/safe-action/`: the session middleware puts `learnerId` in `ctx` and refuses without a session (TDD: test → impl)
- [x] 3.2 Learner actions: mark, unmark, record position, record continue-watching, save profile. Tests cover the session refusal, validation errors, the write through the use case, and that no input schema has an id field (TDD: test → impl)
- [x] 3.3 `POST /api/learner/playback-position` route handler: `401`, `400`, then the write (TDD: test → impl)
- [x] 3.4 Remove `progress` and `positions` from `getCoursePlatformDeps`, and update its callers and tests (TDD: adjust tests → impl)

## 4. Client store

- [x] 4.1 `src/lib/learner-store/`: vanilla zustand store, browser-only `seedLearnerStore`, identity-stable selectors, the `writeThrough` rollback helper, and a `seedLearnerStore` test helper (TDD: test → impl)
- [x] 4.2 `LearnerStateSeed` client component (seeds in `useLayoutEffect`), rendered by the locale layout with `loadLearnerSnapshot` output when signed in. Story, test and JSDoc (TDD: test → impl)

## 5. Client adapters and composition roots

- [x] 5.1 `LearnerStoreProgressTracker` (reads the store, writes through the mark and unmark actions with rollback). `use-lesson-completion` reads its snapshot from the store, uses it as the default tracker, and drops the storage listener (TDD: test → impl)
- [x] 5.2 `use-saved-playback-positions` reads the store (TDD: test → impl)
- [x] 5.3 `LearnerStorePlaybackPositionRepository`: store update on every `setPosition`, a 10 s per-lesson server throttle, and `flush()`. It is the default of `usePlaybackPosition` (TDD: test → impl)
- [x] 5.4 `use-persist-playback-position`: flush on pause, seeking, ended and unmount. `pagehide` sends the beacon instead of `beforeunload` (TDD: test → impl)
- [x] 5.5 `LearnerStoreContinueWatchingRepository` as the default of `useContinueWatching` (TDD: test → impl)
- [x] 5.6 `LearnerStoreLearnerProfileRepository` as the default of `useLearnerProfile`. Drop the storage listener, and `save` keeps its `Promise<boolean>` (TDD: test → impl)
- [x] 5.7 Delete the four `browser-local-storage-*` adapters and their tests, and fix remaining imports (refactor, tests stay green)

## 6. Existing tests and stories

- [x] 6.1 Re-seed every hook and component test that wrote `learning-english:{completed,playback,continue-watching,learner-profile}` keys through `seedLearnerStore()` (refactor, the assertions stay the same)
- [x] 6.2 Re-seed the stories that wrote those keys (`course-progress-board`, `site-header`, `lesson-completion-mark`, `module-watch-progress`, …) and check them in Storybook with Playwright MCP

## 7. End-to-end

- [x] 7.1 `e2e/learner-state-fixture.ts`: seed profile, completion, positions and location rows for the fixture learner. Replace every `addInitScript` that seeded those keys (test infrastructure)
- [x] 7.2 `e2e/learner-progress-sync.spec.ts`: a mark and a position made in context A show in context B for the same learner; closing the page keeps the latest position; a card made once skips the onboarding in the other context (TDD: spec first)

## 8. Verification

- [x] 8.1 Run `pnpm verify` with Docker up, and `pnpm test:e2e --project=chromium` against the Compose stack. Check the lesson page, My learning and the Profile page in the browser with Playwright MCP
