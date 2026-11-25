CREATE TABLE `cash_closures` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`date` text NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`payment_count` integer DEFAULT 0 NOT NULL,
	`closed_by_user_id` text,
	`closed_by_name` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`closed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `cash_closures_tenant_idx` ON `cash_closures` (`establishment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cash_closures_tenant_date_idx` ON `cash_closures` (`establishment_id`,`date`);--> statement-breakpoint
CREATE TABLE `fee_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`academic_year_id` text,
	`student_id` text NOT NULL,
	`label` text NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'À payer' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fee_invoices_tenant_idx` ON `fee_invoices` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `fee_invoices_student_idx` ON `fee_invoices` (`student_id`);--> statement-breakpoint
CREATE INDEX `fee_invoices_status_idx` ON `fee_invoices` (`status`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`student_id` text NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`method` text DEFAULT 'Espèces' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`paid_at` text NOT NULL,
	`received_by_user_id` text,
	`received_by_name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Validé' NOT NULL,
	`receipt_number` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `fee_invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`received_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `payments_tenant_idx` ON `payments` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `payments_invoice_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payments_student_idx` ON `payments` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_receipt_idx` ON `payments` (`establishment_id`,`receipt_number`);