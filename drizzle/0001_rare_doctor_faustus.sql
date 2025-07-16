PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shopping_lists` (
	`list_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_name` text NOT NULL,
	`chat_id` integer NOT NULL,
	`message_id` integer
);
--> statement-breakpoint
INSERT INTO `__new_shopping_lists`("list_id", "list_name", "chat_id", "message_id") SELECT "list_id", "list_name", "chat_id", "message_id" FROM `shopping_lists`;--> statement-breakpoint
DROP TABLE `shopping_lists`;--> statement-breakpoint
ALTER TABLE `__new_shopping_lists` RENAME TO `shopping_lists`;--> statement-breakpoint
PRAGMA foreign_keys=ON;