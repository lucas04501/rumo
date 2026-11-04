CREATE TABLE "water_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"amount_ml" integer NOT NULL,
	"logged_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "water_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_ml" integer NOT NULL,
	"cup_ml" integer NOT NULL,
	"habit_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_settings" ADD CONSTRAINT "water_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_settings" ADD CONSTRAINT "water_settings_habit_owner_fk" FOREIGN KEY ("user_id","habit_id") REFERENCES "public"."habits"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "water_logs_user_date_idx" ON "water_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "water_settings_user_idx" ON "water_settings" USING btree ("user_id");--> statement-breakpoint
-- Segunda trava, como em 0007_rls.sql: o papel `rumo_app` só enxerga as linhas do usuário da sessão.
DO $$
DECLARE
  name text;
BEGIN
  FOREACH name IN ARRAY ARRAY['water_settings', 'water_logs'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO rumo_app', name);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', name);
    EXECUTE format(
      'CREATE POLICY dono ON %I TO rumo_app
         USING (user_id = current_setting(''app.user_id'', true))
         WITH CHECK (user_id = current_setting(''app.user_id'', true))',
      name
    );
  END LOOP;
END
$$;
