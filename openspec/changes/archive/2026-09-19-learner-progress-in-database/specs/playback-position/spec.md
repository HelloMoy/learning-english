## REMOVED Requirements

### Requirement: `BrowserLocalStoragePlaybackPositionRepository` persists positions in `localStorage`
**Reason**: Playback positions move to the signed-in learner's rows in the database.
**Migration**: The Turso `PlaybackPositionRepository` adapter (capability `learner-state`) honours the same scenarios: round-trip, `null` for an unsaved lesson, and isolation between lessons. Server writes are coalesced as `learner-state` specifies. Existing `learning-english:playback:*` keys are ignored and not imported.
