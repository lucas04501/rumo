import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { auth, signupOpen } from './auth.js'
import { goals, habits, milestones, notes, tasks } from './db/schema.js'
import { checks } from './routes/checks.js'
import { days } from './routes/days.js'
import { resource } from './routes/resource.js'
import { goalFields, habitFields, milestoneFields, noteFields, taskFields } from './routes/schemas.js'
import { requireUser, type AuthedEnv } from './session.js'

const FOREIGN_KEY_VIOLATION = '23503'

function postgresCode(error: unknown): string | undefined {
  const { code, cause } = error as { code?: string; cause?: unknown }
  return code ?? (cause ? postgresCode(cause) : undefined)
}

const data = new Hono<AuthedEnv>()
  .use(requireUser)
  .route('/goals', resource(goals, goalFields))
  .route('/milestones', resource(milestones, milestoneFields))
  .route('/habits', resource(habits, habitFields))
  .route('/tasks', resource(tasks, taskFields))
  .route('/notes', resource(notes, noteFields))
  .route('/checks', checks)
  .route('/days', days)

export const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => c.json({ ok: true }))
  .get('/signup-status', (c) => c.json({ open: signupOpen }))
  .on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/', data)

app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status)
  // Vínculo com algo que não é do usuário: responde como se não existisse.
  if (postgresCode(error) === FOREIGN_KEY_VIOLATION) return c.json({ error: 'not_found' }, 404)

  console.error(error)
  return c.json({ error: 'internal_error' }, 500)
})
