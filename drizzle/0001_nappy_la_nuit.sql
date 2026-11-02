CREATE TABLE "habit_pauses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "habit_pauses_range" CHECK ("habit_pauses"."end_date" >= "habit_pauses"."start_date")
);
--> statement-breakpoint
ALTER TABLE "habit_pauses" ADD CONSTRAINT "habit_pauses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_pauses" ADD CONSTRAINT "habit_pauses_habit_owner_fk" FOREIGN KEY ("user_id","habit_id") REFERENCES "public"."habits"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habit_pauses_habit_idx" ON "habit_pauses" USING btree ("habit_id");