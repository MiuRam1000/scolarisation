CREATE TABLE `administrative_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`kind` text NOT NULL,
	`reference` text NOT NULL,
	`title` text NOT NULL,
	`student_id` text,
	`class_id` text,
	`recipient` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`snapshot` text DEFAULT '{}' NOT NULL,
	`issued_by_user_id` text,
	`issued_by_name` text DEFAULT '' NOT NULL,
	`issued_at` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`issued_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `administrative_documents_tenant_idx` ON `administrative_documents` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `administrative_documents_kind_idx` ON `administrative_documents` (`kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `administrative_documents_reference_idx` ON `administrative_documents` (`establishment_id`,`reference`);
