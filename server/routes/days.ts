import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client.js'
import { days as daysTable } from '../db/schema.js'
import type { AuthedEnv } from '../session.js'
import { dateRange, editedAt, isoDate, moment, parse, readJson, resolveEditTime } from '../validation.js'

const dayBody = z.object({
  completedAt: moment.nullable().optional(),
  note: z.string().max(20_000).nullable().optional(),
  editedAt,
})

export const days = new Hono<AuthedEnv>()
  .get('/', async (c) => {
    const { from, to } = parse(dateRange, c.req.query())
    const rows = await db
      .select()
      .from(daysTable)
      .where(
        and(
          eq(daysTable.userId, c.get('userId')),
          gte(daysTable.date, from),
          lte(daysTable.date, to),
        ),
      )
      .orderBy(asc(daysTable.date))
    return c.json(rows)
  })
  .put('/:date', async (c) => {
    const date = parse(isoDate, c.req.param('date'))
    const { editedAt: edited, completedAt, note } = await readJson(c, dayBody)
    const updatedAt = resolveEditTime(edited)
    const userId = c.get('userId')

    const data = {
      ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      ...(note !== undefined && { note }),
    }

    const [row] = await db
      .insert(daysTable)
      .values({ ...data, userId, date, updatedAt })
      .onConflictDoUpdate({
        target: [daysTable.userId, daysTable.date],
        set: { ...data, updatedAt },
        setWhere: lte(daysTable.updatedAt, updatedAt),
      })
      .returning()

    return c.json(row ?? { error: 'stale' }, row ? 200 : 409)
  })
