import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client.js'
import { achievementsSeen } from '../db/schema.js'
import type { AuthedEnv } from '../session.js'
import { parse } from '../validation.js'

const achievementId = z.string().regex(/^[a-z0-9-]{1,64}$/)

// Como o check, existe ou não existe: a fila offline pode repetir sem mudar nada.
export const achievements = new Hono<AuthedEnv>()
  .get('/', async (c) => {
    const rows = await db
      .select({ id: achievementsSeen.achievementId, seenAt: achievementsSeen.seenAt })
      .from(achievementsSeen)
      .where(eq(achievementsSeen.userId, c.get('userId')))
      .orderBy(asc(achievementsSeen.seenAt))
    return c.json(rows)
  })
  .put('/:id', async (c) => {
    const id = parse(achievementId, c.req.param('id'))
    await db
      .insert(achievementsSeen)
      .values({ userId: c.get('userId'), achievementId: id })
      .onConflictDoNothing()
    return c.body(null, 204)
  })
