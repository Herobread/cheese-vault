CREATE TABLE `shopping_items` (
	`item_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_name` text NOT NULL,
	`list_id` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `shopping_lists`(`list_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`list_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_name` text NOT NULL,
	`chat_id` integer NOT NULL,
	`message_id` integer NOT NULL
);
