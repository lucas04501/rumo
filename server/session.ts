import { createMiddleware } from 'hono/factory'
import { auth } from './auth.js'

export type AuthedEnv = {
  Variables: { userId: string }
}

/** Toda rota do app passa por aqui. O dono de cada linha vem da sessão, nunca do corpo. */
export const requireUser = createMiddleware<AuthedEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'unauthorized' }, 401)

  c.set('userId', session.user.id)
  await next()
})
