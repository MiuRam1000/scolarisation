CREATE TABLE `academic_years` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`label` text NOT NULL,
	`starts_on` text DEFAULT '' NOT NULL,
	`ends_on` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `academic_years_tenant_idx` ON `academic_years` (`establishment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `academic_years_label_idx` ON `academic_years` (`establishment_id`,`label`);--> statement-breakpoint
CREATE TABLE `periods` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`academic_year_id` text NOT NULL,
	`name` text NOT NULL,
	`starts_on` text DEFAULT '' NOT NULL,
	`ends_on` text DEFAULT '' NOT NULL,
	`grades_deadline` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Planifiée' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `periods_tenant_idx` ON `periods` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `periods_year_idx` ON `periods` (`academic_year_id`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'Salle de cours' NOT NULL,
	`capacity` integer DEFAULT 30 NOT NULL,
	`equipment` text DEFAULT '' NOT NULL,
	`building` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Disponible' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rooms_tenant_idx` ON `rooms` (`establishment_id`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`name` text NOT NULL,
	`level` text DEFAULT '' NOT NULL,
	`coefficient` integer DEFAULT 1 NOT NULL,
	`weekly_hours` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Actif' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subjects_tenant_idx` ON `subjects` (`establishment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_name_level_idx` ON `subjects` (`establishment_id`,`name`,`level`);--> statement-breakpoint
ALTER TABLE `establishments` ADD `period_type` text DEFAULT 'Trimestres' NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `rounding` text DEFAULT '2 décimales' NOT NULL;