CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`establishment_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`audience` text DEFAULT 'Tous' NOT NULL,
	`class_id` text,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`created_by_user_id` text,
	`created_by_name` text DEFAULT '' NOT NULL,
	`published_at` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `announcements_tenant_idx` ON `announcements` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `announcements_status_idx` ON `announcements` (`status`);--> statement-breakpoint
CREATE INDEX `announcements_audience_idx` ON `announcements` (`audience`);