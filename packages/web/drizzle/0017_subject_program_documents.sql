CREATE TABLE IF NOT EXISTS `subject_program_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text DEFAULT '' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`uploaded_by` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `subject_program_documents_tenant_idx` ON `subject_program_documents` (`establishment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `subject_program_documents_subject_idx` ON `subject_program_documents` (`subject_id`);
