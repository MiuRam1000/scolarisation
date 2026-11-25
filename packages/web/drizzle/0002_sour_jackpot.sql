CREATE TABLE `student_history` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`action` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`actor` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `student_history_tenant_idx` ON `student_history` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `student_history_student_idx` ON `student_history` (`student_id`);--> statement-breakpoint
INSERT INTO `student_history` (`id`, `establishment_id`, `student_id`, `action`, `detail`, `actor`, `created_at`)
SELECT lower(hex(randomblob(16))), `establishment_id`, `id`, 'Création du dossier', 'Inscription', 'Administration', `created_at` FROM `students`;