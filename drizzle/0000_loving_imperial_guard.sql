CREATE TABLE `chat_data` (
	`chat_id` integer PRIMARY KEY NOT NULL,
	`next_id` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shopping_items` (
	`uid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`item_name` text NOT NULL,
	`list_id` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `shopping_lists`(`list_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_items_uid_unique` ON `shopping_items` (`uid`);--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`list_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_name` text NOT NULL,
	`chat_id` integer NOT NULL,
	`message_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shopping_lists_list_id_unique` ON `shopping_lists` (`list_id`);