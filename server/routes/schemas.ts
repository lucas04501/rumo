import { z } from 'zod'
import { isoDate, moment, uuid } from '../validation.js'

const title = z.string().trim().min(1).max(300)
const position = z.number().int().min(0).max(1_000_000).default(0)

// Datas de conclusão chegam como texto e viram `Date` para o banco.
const instant = moment
  .nullable()
  .default(null)
  .transform((value) => (value ? new Date(value) : null))

export const goalFields = z.object({
  title,
  why: z.string().max(5_000).nullable().default(null),
  targetDate: isoDate.nullable().default(null),
  status: z.enum(['active', 'done', 'archived']).default('active'),
  doneAt: instant,
  position,
})

export const milestoneFields = z.object({
  goalId: uuid,
  title,
  position,
  doneAt: instant,
})

export const habitFields = z.object({
  title,
  icon: z.string().min(1).max(40),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  startDate: isoDate,
  goalId: uuid.nullable().default(null),
  archivedAt: instant,
  position,
})

export const pauseFields = z.object({
  habitId: uuid,
  startDate: isoDate,
  endDate: isoDate,
})

const priority = z.enum(['high', 'normal', 'low']).default('normal')

export const taskFields = z.object({
  date: isoDate,
  title,
  goalId: uuid.nullable().default(null),
  doneAt: instant,
  position,
  priority,
  ruleId: uuid.nullable().default(null),
  skippedAt: instant,
  startedAt: instant,
})

export const taskRuleFields = z.object({
  title,
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  monthDay: z.number().int().min(1).max(31).nullable().default(null),
  startDate: isoDate,
  endDate: isoDate.nullable().default(null),
  priority,
  goalId: uuid.nullable().default(null),
  position,
})

export const subtaskFields = z.object({
  taskId: uuid,
  title,
  position,
  doneAt: instant,
})

export const routineStepFields = z.object({
  weekday: z.number().int().min(0).max(6),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  title,
  position,
})

export const routineCheckFields = z.object({
  stepId: uuid,
  date: isoDate,
  doneAt: instant,
})

export const focusFields = z.object({
  taskId: uuid.nullable().default(null),
  date: isoDate,
  startedAt: moment.transform((value) => new Date(value)),
  minutes: z.number().int().min(0).max(600),
  plannedMinutes: z.number().int().min(1).max(600),
})

export const noteFields = z.object({
  goalId: uuid.nullable().default(null),
  title: z.string().max(300).default(''),
  body: z.string().max(100_000).default(''),
  pinned: z.boolean().default(false),
})

const exerciseRef = z.string().min(1).max(64)
const loadKg = z.number().min(0).max(2000).nullable().default(null)

export const workoutPlanFields = z.object({
  title,
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  habitId: uuid.nullable().default(null),
  goalId: uuid.nullable().default(null),
  archivedAt: instant,
  position,
})

export const planExerciseFields = z.object({
  planId: uuid,
  exerciseRef,
  position,
  sets: z.number().int().min(1).max(50),
  reps: z.number().int().min(0).max(1000),
  loadKg,
  restSeconds: z.number().int().min(0).max(3600),
  notes: z.string().max(2_000).nullable().default(null),
})

export const workoutSessionFields = z.object({
  planId: uuid,
  date: isoDate,
  startedAt: moment.transform((value) => new Date(value)),
  finishedAt: instant,
  notes: z.string().max(5_000).nullable().default(null),
})

export const sessionSetFields = z.object({
  sessionId: uuid,
  exerciseRef,
  position,
  reps: z.number().int().min(0).max(1000),
  loadKg,
  doneAt: moment.transform((value) => new Date(value)),
})

export const customExerciseFields = z.object({
  name: title,
  muscle: z.string().trim().min(1).max(40),
  instructions: z.string().max(2_000).default(''),
})
