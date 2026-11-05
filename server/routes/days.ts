import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { claim, db } from '../db/client.js'
import { days as daysTable } from '../db/schema.js'
import type { AuthedEnv } from '../session.js'
import { proOpen } from './limits.js'
import { dateRange, editedAt, isoDate, moment, parse, readJson, resolveEditTime } from '../validation.js'

const dayBody = z.object({
  completedAt: moment.nullable().optional(),
  note: z.string().max(20_000).nullable().optional(),
  editedAt,
})

export const days = new Hono<AuthedEnv>()
  .get('/', async (c) => {
    const { from, to } = parse(dateRange, c.req.query())
    const userId = c.get('userId')
    const [, rows] = await db.batch([
      claim(userId),
      db
        .select()
        .from(daysTable)
        .where(and(eq(daysTable.userId, userId), gte(daysTable.date, from), lte(daysTable.date, to)))
        .orderBy(asc(daysTable.date)),
    ])
    return c.json(rows)
  })
  .put('/:date', async (c) => {
    const date = parse(isoDate, c.req.param('date'))
    const { editedAt: edited, completedAt, note } = await readJson(c, dayBody)
    const updatedAt = resolveEditTime(edited)
    const userId = c.get('userId')
    // O dia concluído é dos hábitos e fica livre. Escrever no registro diário é de Notas, do
    // Pro. Apagar o texto (vazio ou nulo) é excluir e continua livre.
    if (note) await proOpen({ userId })

    const data = {
      ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      ...(note !== undefined && { note }),
    }

    const [, [row]] = await db.batch([
      claim(userId),
      db
        .insert(daysTable)
        .values({ ...data, userId, date, updatedAt })
        .onConflictDoUpdate({
          target: [daysTable.userId, daysTable.date],
          set: { ...data, updatedAt },
          setWhere: lte(daysTable.updatedAt, updatedAt),
        })
        .returning(),
    ])

    return c.json(row ?? { error: 'stale' }, row ? 200 : 409)
  })
