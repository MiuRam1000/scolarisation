CREATE TABLE `student_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`kind` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text DEFAULT '' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`uploaded_by` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `student_documents_tenant_idx` ON `student_documents` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `student_documents_student_idx` ON `student_documents` (`student_id`);