CREATE TABLE "competitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"category" text NOT NULL,
	"prize_value" integer NOT NULL,
	"ticket_price" integer NOT NULL,
	"max_tickets_per_user" integer NOT NULL,
	"total_tickets" integer NOT NULL,
	"tickets_sold" integer DEFAULT 0,
	"brand" text,
	"draw_date" timestamp NOT NULL,
	"is_live" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"competition_id" integer NOT NULL,
	"ticket_count" integer NOT NULL,
	"payment_status" text NOT NULL,
	"stripe_payment_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"display_name" text,
	"mascot" text DEFAULT 'blue-whale',
	"stripe_customer_id" text,
	"is_admin" boolean DEFAULT false,
	"is_banned" boolean DEFAULT false,
	"notification_settings" json DEFAULT '{"email":true,"inApp":true}'::json,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "winners" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"competition_id" integer NOT NULL,
	"entry_id" integer NOT NULL,
	"announced_at" timestamp DEFAULT now(),
	"claim_status" text DEFAULT 'pending'
);
