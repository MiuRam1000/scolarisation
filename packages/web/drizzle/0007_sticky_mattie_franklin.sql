CREATE TABLE `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`class_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`period_id` text,
	`name` text NOT NULL,
	`coefficient` integer DEFAULT 1 NOT NULL,
	`max_score` integer DEFAULT 20 NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `evaluations_tenant_idx` ON `evaluations` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `evaluations_class_idx` ON `evaluations` (`class_id`);--> statement-breakpoint
CREATE INDEX `evaluations_period_idx` ON `evaluations` (`period_id`);--> statement-breakpoint
CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`evaluation_id` text NOT NULL,
	`student_id` text NOT NULL,
	`score` real,
	`comment` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `grades_tenant_idx` ON `grades` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `grades_evaluation_idx` ON `grades` (`evaluation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `grades_evaluation_student_idx` ON `grades` (`evaluation_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `report_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`period_id` text NOT NULL,
	`class_id` text,
	`average` real,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`generated_at` text DEFAULT '' NOT NULL,
	`published_at` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `report_cards_tenant_idx` ON `report_cards` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `report_cards_period_idx` ON `report_cards` (`period_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `report_cards_student_period_idx` ON `report_cards` (`student_id`,`period_id`);