PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shopping_items` (
	`uid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`item_name` text NOT NULL,
	`list_id` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `shopping_lists`(`list_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_shopping_items`("uid", "item_id", "item_name", "list_id") SELECT "uid", "item_id", "item_name", "list_id" FROM `shopping_items`;--> statement-breakpoint
DROP TABLE `shopping_items`;--> statement-breakpoint
ALTER TABLE `__new_shopping_items` RENAME TO `shopping_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_items_uid_unique` ON `shopping_items` (`uid`);