## REMOVED Requirements

### Requirement: `BrowserLocalStorageContinueWatchingRepository` persists the location in `localStorage`
**Reason**: The continue-watching location moves to the signed-in learner's row in the database.
**Migration**: The Turso `ContinueWatchingRepository` adapter (capability `learner-state`) holds one location per learner, returns `null` when none is stored or the stored row no longer parses, and never throws on a failed write; the Lesson Page keeps recording through the same composition root. The `learning-english:continue-watching` key is ignored and not imported.
