-- Manual rollback aid for `course-enrollment`. Run ONLY if the code is reverted
-- to a version that reads `continue_watching` as one row per learner.
-- Keeps each learner's most recent location and drops the rest.
DELETE FROM continue_watching
WHERE rowid NOT IN (
  SELECT rowid FROM (
    SELECT rowid, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rank
    FROM continue_watching
  ) WHERE rank = 1
);
