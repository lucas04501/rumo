CREATE TABLE "custom_exercises" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"muscle" text NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plan_exercises" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"exercise_ref" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"sets" smallint DEFAULT 3 NOT NULL,
	"reps" smallint DEFAULT 10 NOT NULL,
	"load_kg" real,
	"rest_seconds" smallint DEFAULT 90 NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "session_sets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_ref" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"reps" smallint NOT NULL,
	"load_kg" real,
	"done_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_plans" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"weekdays" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	"habit_id" uuid,
	"goal_id" uuid,
	"archived_at" timestamp with time zone,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workout_plans_owner_key" UNIQUE("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"date" date NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workout_sessions_owner_key" UNIQUE("user_id","id")
);
--> statement-breakpoint
ALTER TABLE "custom_exercises" ADD CONSTRAINT "custom_exercises_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_exercises" ADD CONSTRAINT "plan_exercises_plan_owner_fk" FOREIGN KEY ("user_id","plan_id") REFERENCES "public"."workout_plans"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_session_owner_fk" FOREIGN KEY ("user_id","session_id") REFERENCES "public"."workout_sessions"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_habit_owner_fk" FOREIGN KEY ("user_id","habit_id") REFERENCES "public"."habits"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_goal_owner_fk" FOREIGN KEY ("user_id","goal_id") REFERENCES "public"."goals"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_owner_fk" FOREIGN KEY ("user_id","plan_id") REFERENCES "public"."workout_plans"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_exercises_user_idx" ON "custom_exercises" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plan_exercises_plan_idx" ON "plan_exercises" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "session_sets_session_idx" ON "session_sets" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "workout_sessions_user_date_idx" ON "workout_sessions" USING btree ("user_id","date");