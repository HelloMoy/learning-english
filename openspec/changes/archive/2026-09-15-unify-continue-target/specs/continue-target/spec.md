## ADDED Requirements

### Requirement: One rule picks the video a learner continues with

Every surface that offers to continue SHALL pick its video with one rule, implemented once by
`findContinueTarget` (`src/lib/continue-target/`): the module overview's featured step, the course
overview's continue tile, and My learning's resume panel and lead lesson card. No
surface SHALL offer the raw continue-watching record without applying it.

The rule takes an ordered list of videos (one module, or a whole course with its lessons in `sequence`
order and videos in `sequence` order within each), the learner's progress on this device, and the last
opened video (the lesson recorded by the `continue-watching` capability).

It first finds an **anchor**:

- the **last opened** video, when it belongs to the list;
- otherwise the **furthest** video with any progress — finished, or a watched fraction above 0;
- otherwise there is no anchor.

From the anchor it picks the target:

- no videos → nothing to continue (`none`);
- every video finished → the first video, to watch again (`rewatch`);
- no anchor → the first video, to start (`start`);
- the anchor is not finished → the anchor (`continue`);
- the anchor is finished → the first unfinished video after it (`continue`);
- nothing unfinished follows it → the first unfinished video of the list (`continue`).

Completion SHALL be decided with `countsAsComplete` and progress with `watchedFraction`, the rules every
other progress indicator uses.

The lesson page's **Up next** and the course navigator answer a different question — the video that follows
the one open — and are not governed by this rule.

#### Scenario: A learner going in order continues with the next video
- **WHEN** videos 1–5 are finished and video 5 was opened last
- **THEN** the target is video 6

#### Scenario: A finished recorded video is not offered again
- **WHEN** the last opened video is finished
- **THEN** the target is the first unfinished video after it, never the finished video itself

#### Scenario: A partly watched last opened video is continued itself
- **WHEN** videos 25–27 are finished and video 7 was opened last and is partly watched
- **THEN** the target is video 7

#### Scenario: A learner who returned to the start continues there
- **WHEN** videos 25–27 are finished, and afterwards videos 1–2 were finished with video 2 opened last
- **THEN** the target is video 3, not video 28

#### Scenario: A record outside the list falls back to the furthest progress
- **WHEN** videos 25–27 of the list are finished and the last opened video belongs to another list
- **THEN** the target is video 28

#### Scenario: A partly watched furthest video is continued when there is no record
- **WHEN** there is no record, video 1 is finished, video 2 is not started and video 7 is partly watched
- **THEN** the target is video 7

#### Scenario: Nothing left after the anchor falls back to the first gap
- **WHEN** the last video is finished and opened last, videos 1–2 are finished and videos 3–24 have no progress
- **THEN** the target is video 3

#### Scenario: Across a course, the last video of a lesson hands over to the next lesson
- **WHEN** the list is a whole course and the last opened video, the final video of its second lesson, is finished
- **THEN** the target is the first unfinished video of the third lesson

#### Scenario: An untouched list starts at its first video
- **WHEN** no video has any progress and no record names a video of the list
- **THEN** the target is the first video, to start

#### Scenario: A finished list is watched again
- **WHEN** every video of the list is finished
- **THEN** the target is the first video, to watch again

#### Scenario: An empty list has nothing to continue
- **WHEN** the list holds no videos
- **THEN** there is no target

### Requirement: The course catalog lists lesson progress in learning order

The course catalog SHALL list each course's lesson progress slices in learning order — by their module's
`sequence`, then by the lesson's `sequence` — so a surface holding only the catalog can apply the
continue-target rule to a whole course.

#### Scenario: Slices follow learning order whatever the repository returns
- **WHEN** the lesson repository returns a course's lessons shuffled across modules
- **THEN** the catalog's slices for that course list the first module's lessons in `sequence` order, then the second module's, and so on
