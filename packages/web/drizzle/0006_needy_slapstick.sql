CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`academic_year_id` text,
	`school_year` text DEFAULT '' NOT NULL,
	`class_id` text,
	`enrolled_at` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'inscription' NOT NULL,
	`status` text DEFAULT 'Inscrit' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `enrollments_tenant_idx` ON `enrollments` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `enrollments_student_idx` ON `enrollments` (`student_id`);--> statement-breakpoint
ALTER TABLE `students` ADD `admission_decision` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `admission_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `archived_at` text DEFAULT '' NOT NULL;