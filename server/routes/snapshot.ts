import { and, asc, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client.js'
import {
  achievementsSeen,
  customExercises,
  days,
  focusSessions,
  goals,
  habitChecks,
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
  user,
  workoutPlans,
  workoutSessions,
} from '../db/schema.js'
import type { AuthedEnv } from '../session.js'

/**
 * Todos os dados do usuário em uma chamada. O app guarda essa foto no aparelho,
 * o que permite abrir na hora, calcular XP sem internet e fazer menos chamadas
 * ao banco. Para uma pessoa, o volume é pequeno.
 */
export const snapshot = new Hono<AuthedEnv>().get('/', async (c) => {
  const userId = c.get('userId')

  const [
    owner,
    goalRows,
    milestoneRows,
    habitRows,
    pauseRows,
    checkRows,
    taskRows,
    ruleRows,
    subtaskRows,
    focusRows,
    stepRows,
    routineCheckRows,
    noteRows,
    dayRows,
    seenRows,
    planRows,
    planExerciseRows,
    workoutRows,
    setRows,
    customRows,
  ] = await Promise.all([
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
    db
      .select()
      .from(taskRules)
      .where(and(eq(taskRules.userId, userId), isNull(taskRules.deletedAt)))
      .orderBy(asc(taskRules.position)),
    db
      .select()
      .from(subtasks)
      .where(and(eq(subtasks.userId, userId), isNull(subtasks.deletedAt)))
      .orderBy(asc(subtasks.position)),
    db
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), isNull(focusSessions.deletedAt)))
      .orderBy(asc(focusSessions.startedAt)),
    db
      .select()
      .from(routineSteps)
      .where(and(eq(routineSteps.userId, userId), isNull(routineSteps.deletedAt)))
      .orderBy(asc(routineSteps.time), asc(routineSteps.position)),
    db
      .select()
      .from(routineChecks)
      .where(
        and(
          eq(routineChecks.userId, userId),
          isNull(routineChecks.deletedAt),
          isNotNull(routineChecks.doneAt),
        ),
      ),
    db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
      .orderBy(desc(notes.updatedAt)),
    db.select().from(days).where(eq(days.userId, userId)),
    db
      .select({ id: achievementsSeen.achievementId })
      .from(achievementsSeen)
      .where(eq(achievementsSeen.userId, userId)),
    db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.userId, userId), isNull(workoutPlans.deletedAt)))
      .orderBy(asc(workoutPlans.position)),
    db
      .select()
      .from(planExercises)
      .where(and(eq(planExercises.userId, userId), isNull(planExercises.deletedAt)))
      .orderBy(asc(planExercises.position)),
    db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), isNull(workoutSessions.deletedAt)))
      .orderBy(asc(workoutSessions.startedAt)),
    db
      .select()
      .from(sessionSets)
      .where(and(eq(sessionSets.userId, userId), isNull(sessionSets.deletedAt)))
      .orderBy(asc(sessionSets.position)),
    db
      .select()
      .from(customExercises)
      .where(and(eq(customExercises.userId, userId), isNull(customExercises.deletedAt))),
  ])

  return c.json({
    user: { name: owner[0]?.name ?? '' },
    goals: goalRows,
    milestones: milestoneRows,
    habits: habitRows,
    pauses: pauseRows,
    checks: checkRows,
    tasks: taskRows,
    taskRules: ruleRows,
    subtasks: subtaskRows,
    focusSessions: focusRows,
    routineSteps: stepRows,
    routineChecks: routineCheckRows,
    notes: noteRows,
    days: dayRows,
    achievementsSeen: seenRows.map((row) => row.id),
    workoutPlans: planRows,
    planExercises: planExerciseRows,
    workoutSessions: workoutRows,
    sessionSets: setRows,
    customExercises: customRows,
  })
})
