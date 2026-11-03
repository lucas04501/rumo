import { asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { claim, db } from '../db/client.js'
import { achievementsSeen } from '../db/schema.js'
import type { AuthedEnv } from '../session.js'
import { parse } from '../validation.js'

const achievementId = z.string().regex(/^[a-z0-9-]{1,64}$/)

// Como o check, existe ou não existe: a fila offline pode repetir sem mudar nada.
export const achievements = new Hono<AuthedEnv>()
  .get('/', async (c) => {
    const userId = c.get('userId')
    const [, rows] = await db.batch([
      claim(userId),
      db
        .select({ id: achievementsSeen.achievementId, seenAt: achievementsSeen.seenAt })
        .from(achievementsSeen)
        .where(eq(achievementsSeen.userId, userId))
        .orderBy(asc(achievementsSeen.seenAt)),
    ])
    return c.json(rows)
  })
  .put('/:id', async (c) => {
    const id = parse(achievementId, c.req.param('id'))
    const userId = c.get('userId')
    await db.batch([
      claim(userId),
      db.insert(achievementsSeen).values({ userId, achievementId: id }).onConflictDoNothing(),
    ])
    return c.body(null, 204)
  })
