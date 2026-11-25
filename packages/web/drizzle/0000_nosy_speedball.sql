CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`name` text NOT NULL,
	`level` text DEFAULT '' NOT NULL,
	`room` text DEFAULT '' NOT NULL,
	`capacity` integer DEFAULT 30 NOT NULL,
	`main_teacher` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Actif' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `classes_tenant_idx` ON `classes` (`establishment_id`);--> statement-breakpoint
CREATE TABLE `establishments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'EUR — Euro' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `establishments_slug_idx` ON `establishments` (`slug`);--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Actif' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `guardians_tenant_idx` ON `guardians` (`establishment_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`type` text DEFAULT 'Enseignant' NOT NULL,
	`specialty` text DEFAULT '' NOT NULL,
	`assignments` text DEFAULT '' NOT NULL,
	`weekly_hours` integer DEFAULT 0 NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Actif' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `staff_tenant_idx` ON `staff` (`establishment_id`);--> statement-breakpoint
CREATE TABLE `student_guardians` (
	`student_id` text NOT NULL,
	`guardian_id` text NOT NULL,
	`relation` text DEFAULT 'Responsable légal' NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `student_guardians_student_idx` ON `student_guardians` (`student_id`);--> statement-breakpoint
CREATE INDEX `student_guardians_guardian_idx` ON `student_guardians` (`guardian_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`user_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`reference` text NOT NULL,
	`class_id` text,
	`birth_date` text DEFAULT '' NOT NULL,
	`enrolled_at` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Actif' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `students_tenant_idx` ON `students` (`establishment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_reference_idx` ON `students` (`establishment_id`,`reference`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'direction' NOT NULL,
	`password_hash` text NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`establishment_id`);