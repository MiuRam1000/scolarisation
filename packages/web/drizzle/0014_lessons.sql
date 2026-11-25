CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`class_id` text NOT NULL,
	`subject_id` text,
	`teacher_name` text DEFAULT '' NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`start_time` text DEFAULT '' NOT NULL,
	`end_time` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`homework` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Planifié' NOT NULL,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `lessons_tenant_idx` ON `lessons` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `lessons_class_idx` ON `lessons` (`class_id`);--> statement-breakpoint
CREATE INDEX `lessons_date_idx` ON `lessons` (`date`);
