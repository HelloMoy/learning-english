-- Enrollment starts with this release (change `course-enrollment`). Until now
-- production served only the Basic Course, so every account that exists at
-- this point is enrolled in it. Accounts created later start with none.
INSERT OR IGNORE INTO `course_enrollment` (`user_id`, `course_slug`)
  SELECT `id`, 'basic-course' FROM `user`;
--> statement-breakpoint
-- Testers who opened the Advanced draft on develop keep that course too.
INSERT OR IGNORE INTO `course_enrollment` (`user_id`, `course_slug`)
  SELECT `user_id`, `course_slug` FROM `continue_watching`;
