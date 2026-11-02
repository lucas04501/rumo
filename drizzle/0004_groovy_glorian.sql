CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "routine_checks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"step_id" uuid NOT NULL,
	"date" date NOT NULL,
	"done_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routine_steps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weekday" smallint NOT NULL,
	"time" text NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "routine_steps_owner_key" UNIQUE("user_id","id"),
	CONSTRAINT "routine_steps_weekday" CHECK ("routine_steps"."weekday" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "routine_checks" ADD CONSTRAINT "routine_checks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_checks" ADD CONSTRAINT "routine_checks_step_owner_fk" FOREIGN KEY ("user_id","step_id") REFERENCES "public"."routine_steps"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "routine_checks_user_date_idx" ON "routine_checks" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "routine_steps_user_weekday_idx" ON "routine_steps" USING btree ("user_id","weekday");