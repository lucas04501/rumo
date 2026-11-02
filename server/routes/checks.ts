import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client.js'
import { habitChecks } from '../db/schema.js'
import type { AuthedEnv } from '../session.js'
import { dateRange, isoDate, parse, uuid } from '../validation.js'

// Check não é editável: existe ou não existe. Por isso não tem exclusão suave.
export const checks = new Hono<AuthedEnv>()
  .get('/', async (c) => {
    const { from, to } = parse(dateRange, c.req.query())
    const rows = await db
      .select()
      .from(habitChecks)
      .where(
        and(
          eq(habitChecks.userId, c.get('userId')),
          gte(habitChecks.date, from),
          lte(habitChecks.date, to),
        ),
      )
      .orderBy(asc(habitChecks.date))
    return c.json(rows)
  })
  .put('/:habitId/:date', async (c) => {
    const habitId = parse(uuid, c.req.param('habitId'))
    const date = parse(isoDate, c.req.param('date'))

    // A chave estrangeira composta recusa hábito de outro usuário.
    await db
      .insert(habitChecks)
      .values({ habitId, date, userId: c.get('userId') })
      .onConflictDoNothing()

    return c.body(null, 204)
  })
  .delete('/:habitId/:date', async (c) => {
    const habitId = parse(uuid, c.req.param('habitId'))
    const date = parse(isoDate, c.req.param('date'))

    await db
      .delete(habitChecks)
      .where(
        and(
          eq(habitChecks.habitId, habitId),
          eq(habitChecks.date, date),
          eq(habitChecks.userId, c.get('userId')),
        ),
      )

    return c.body(null, 204)
  })
