CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`academic_year_id` text,
	`period_id` text,
	`title` text NOT NULL,
	`type` text DEFAULT 'Examen' NOT NULL,
	`classes_label` text DEFAULT '' NOT NULL,
	`dates_label` text DEFAULT '' NOT NULL,
	`candidates_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by_user_id` text,
	`created_by_name` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `exams_tenant_idx` ON `exams` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `exams_status_idx` ON `exams` (`status`);
