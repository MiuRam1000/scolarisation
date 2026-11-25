ALTER TABLE `subjects` ADD COLUMN `program` text DEFAULT '' NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS `subjects_name_level_idx`;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `subjects_name_level_program_idx` ON `subjects` (`establishment_id`,`name`,`level`,`program`);
