CREATE TABLE `time_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`academic_year_id` text,
	`name` text DEFAULT '' NOT NULL,
	`day_of_week` integer DEFAULT 1 NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`kind` text DEFAULT 'Cours' NOT NULL,
	`status` text DEFAULT 'Actif' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `time_slots_tenant_idx` ON `time_slots` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `time_slots_day_idx` ON `time_slots` (`day_of_week`);--> statement-breakpoint
CREATE TABLE `timetable_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`academic_year_id` text,
	`class_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`staff_id` text,
	`room_id` text,
	`slot_id` text NOT NULL,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`published_at` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`slot_id`) REFERENCES `time_slots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `timetable_tenant_idx` ON `timetable_entries` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `timetable_class_idx` ON `timetable_entries` (`class_id`);--> statement-breakpoint
CREATE INDEX `timetable_staff_idx` ON `timetable_entries` (`staff_id`);--> statement-breakpoint
CREATE INDEX `timetable_room_idx` ON `timetable_entries` (`room_id`);