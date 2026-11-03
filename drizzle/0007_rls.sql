-- Segunda trava: `rumo_app` não faz login. A API entra nele só dentro da transação de cada
-- requisição, com `claim()`, e o papel dono segue de fora da RLS para login e migrações.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rumo_app') THEN
    CREATE ROLE rumo_app NOLOGIN;
  END IF;
END
$$;
--> statement-breakpoint
GRANT rumo_app TO CURRENT_USER;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO rumo_app;
--> statement-breakpoint
DO $$
DECLARE
  name text;
BEGIN
  FOREACH name IN ARRAY ARRAY[
    'goals', 'milestones', 'habits', 'habit_pauses', 'habit_checks', 'days',
    'task_rules', 'tasks', 'subtasks', 'focus_sessions', 'routine_steps', 'routine_checks',
    'notes', 'achievements_seen', 'workout_plans', 'plan_exercises', 'workout_sessions',
    'session_sets', 'custom_exercises'
  ] LOOP
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
