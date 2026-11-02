import { and, asc, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client.js'
import { days, goals, habitChecks, habitPauses, habits, milestones, tasks, user } from '../db/schema.js'
import type { AuthedEnv } from '../session.js'

/**
 * Todos os dados do usuário em uma chamada. O app guarda essa foto no aparelho,
 * o que permite abrir na hora, calcular XP sem internet e fazer menos chamadas
 * ao banco. Para uma pessoa, o volume é pequeno.
 */
export const snapshot = new Hono<AuthedEnv>().get('/', async (c) => {
  const userId = c.get('userId')

  const [owner, goalRows, milestoneRows, habitRows, pauseRows, checkRows, taskRows, dayRows] =
    await Promise.all([
      db.select({ name: user.name }).from(user).where(eq(user.id, userId)),
      db
        .select()
        .from(goals)
        .where(and(eq(goals.userId, userId), isNull(goals.deletedAt)))
        .orderBy(asc(goals.position)),
      db
        .select()
        .from(milestones)
        .where(and(eq(milestones.userId, userId), isNull(milestones.deletedAt)))
        .orderBy(asc(milestones.position)),
      db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, userId), isNull(habits.deletedAt)))
        .orderBy(asc(habits.position)),
      db
        .select()
        .from(habitPauses)
        .where(and(eq(habitPauses.userId, userId), isNull(habitPauses.deletedAt))),
      db
        .select({ habitId: habitChecks.habitId, date: habitChecks.date })
        .from(habitChecks)
        .where(eq(habitChecks.userId, userId)),
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)))
        .orderBy(asc(tasks.position)),
      db.select().from(days).where(eq(days.userId, userId)),
    ])

  return c.json({
    user: { name: owner[0]?.name ?? '' },
    goals: goalRows,
    milestones: milestoneRows,
    habits: habitRows,
    pauses: pauseRows,
    checks: checkRows,
    tasks: taskRows,
    days: dayRows,
  })
})
