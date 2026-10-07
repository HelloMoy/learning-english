## ADDED Requirements

### Requirement: A lesson's declared video teaches that lesson

The manifest SHALL declare, as each video lesson's `source`, the video that
teaches the subject the lesson's title, notes and resources describe. A `source`
that is a well-formed URL but belongs to a different lesson is a content defect,
even though every structural check passes.

#### Scenario: The /ð/ lesson plays the /ð/ lecture

- **WHEN** the manifest declares Basic Course lesson `3-consonants/13-th-voiced`,
  titled `/ð/`
- **THEN** its `source` is `https://www.youtube.com/embed/q_rv_7mopKU`

#### Scenario: The /ŋ/ lesson plays the /ŋ/ lecture

- **WHEN** the manifest declares Basic Course lesson `3-consonants/21-ng`,
  titled `/ŋ/`
- **THEN** its `source` is `https://www.youtube.com/embed/jOF2i5teTfs`
