import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { auth, signupOpen } from './auth.js'
import { claim, db } from './db/client.js'
import {
  customExercises,
  focusSessions,
  goals,
  habitPauses,
  habits,
  milestones,
  notes,
  planExercises,
  routineChecks,
  routineSteps,
  sessionSets,
  subtasks,
  taskRules,
  tasks,
  workoutPlans,
  workoutSessions,
} from './db/schema.js'
import { achievements } from './routes/achievements.js'
import { checks } from './routes/checks.js'
import { days } from './routes/days.js'
import { resource } from './routes/resource.js'
import {
  customExerciseFields,
  focusFields,
  goalFields,
  habitFields,
  milestoneFields,
  noteFields,
  pauseFields,
  planExerciseFields,
  routineCheckFields,
  routineStepFields,
  sessionSetFields,
  subtaskFields,
  taskFields,
  taskRuleFields,
  workoutPlanFields,
  workoutSessionFields,
} from './routes/schemas.js'
import { snapshot } from './routes/snapshot.js'
import { requireUser, type AuthedEnv } from './session.js'

const FOREIGN_KEY_VIOLATION = '23503'
const CHECK_VIOLATION = '23514'
// A RLS recusou: é o mesmo caso de um vínculo com dado de outro usuário.
const RLS_VIOLATION = '42501'

function postgresCode(error: unknown): string | undefined {
  const { code, cause } = error as { code?: string; cause?: unknown }
  return code ?? (cause ? postgresCode(cause) : undefined)
}

const data = new Hono<AuthedEnv>()
  .use(requireUser)
  .route('/goals', resource(goals, goalFields))
  .route('/milestones', resource(milestones, milestoneFields))
  .route('/snapshot', snapshot)
  .route('/habits', resource(habits, habitFields))
  .route('/pauses', resource(habitPauses, pauseFields))
  .route('/tasks', resource(tasks, taskFields))
  .route('/task-rules', resource(taskRules, taskRuleFields))
  .route('/subtasks', resource(subtasks, subtaskFields))
  .route('/focus-sessions', resource(focusSessions, focusFields))
  .route('/routine-steps', resource(routineSteps, routineStepFields))
  .route('/routine-checks', resource(routineChecks, routineCheckFields))
  .route('/notes', resource(notes, noteFields))
  .route('/workout-plans', resource(workoutPlans, workoutPlanFields))
  .route('/plan-exercises', resource(planExercises, planExerciseFields))
  .route('/workout-sessions', resource(workoutSessions, workoutSessionFields))
  .route('/session-sets', resource(sessionSets, sessionSetFields))
  .route('/custom-exercises', resource(customExercises, customExerciseFields))
  .route('/checks', checks)
  .route('/achievements', achievements)
  .route('/days', days)

export const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ ok: true }))
  // Prova sem login que o papel restrito funciona aqui e que ele não enxerga nada de ninguém.
  .get('/health/rls', async (c) => {
    const [, rows] = await db.batch([claim('ninguem'), db.select({ id: goals.id }).from(goals).limit(1)])
    return c.json({ ok: rows.length === 0 })
  })
  .get('/signup-status', (c) => c.json({ open: signupOpen }))
  .on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/', data)

app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status)
  // Vínculo com algo que não é do usuário: responde como se não existisse.
  const code = postgresCode(error)
  if (code === FOREIGN_KEY_VIOLATION || code === RLS_VIOLATION) {
    return c.json({ error: 'not_found' }, 404)
  }
  if (code === CHECK_VIOLATION) return c.json({ error: 'invalid_input' }, 400)

  console.error(error)
  return c.json({ error: 'internal_error' }, 500)
})
