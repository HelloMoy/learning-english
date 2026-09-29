CREATE TABLE `course_enrollment` (
	`user_id` text NOT NULL,
	`course_slug` text NOT NULL,
	`enrolled_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`user_id`, `course_slug`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_continue_watching` (
	`user_id` text NOT NULL,
	`course_slug` text NOT NULL,
	`module_slug` text NOT NULL,
	`lesson_id` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`user_id`, `course_slug`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_continue_watching`("user_id", "course_slug", "module_slug", "lesson_id", "updated_at") SELECT "user_id", "course_slug", "module_slug", "lesson_id", "updated_at" FROM `continue_watching`;--> statement-breakpoint
DROP TABLE `continue_watching`;--> statement-breakpoint
ALTER TABLE `__new_continue_watching` RENAME TO `continue_watching`;--> statement-breakpoint
PRAGMA foreign_keys=ON;