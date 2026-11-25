CREATE TABLE `attendance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`session_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'Présent' NOT NULL,
	`minutes_late` integer DEFAULT 0 NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`justification` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attendance_records_tenant_idx` ON `attendance_records` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `attendance_records_session_idx` ON `attendance_records` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_records_session_student_idx` ON `attendance_records` (`session_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `attendance_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`academic_year_id` text,
	`class_id` text NOT NULL,
	`date` text NOT NULL,
	`slot_id` text,
	`subject_id` text,
	`taken_by_user_id` text,
	`taken_by_name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`slot_id`) REFERENCES `time_slots`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`taken_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `attendance_sessions_tenant_idx` ON `attendance_sessions` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `attendance_sessions_class_date_idx` ON `attendance_sessions` (`class_id`,`date`);--> statement-breakpoint
CREATE TABLE `discipline_incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'Observation' NOT NULL,
	`severity` text DEFAULT 'Moyenne' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`responsible_staff_id` text,
	`responsible_name` text DEFAULT '' NOT NULL,
	`measures` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Ouvert' NOT NULL,
	`created_by_user_id` text,
	`created_by_name` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`responsible_staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `discipline_tenant_idx` ON `discipline_incidents` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `discipline_student_idx` ON `discipline_incidents` (`student_id`);--> statement-breakpoint
CREATE INDEX `discipline_status_idx` ON `discipline_incidents` (`status`);