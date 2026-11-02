import { EXERCISES } from '../content/exercicios'
import type {
  CustomExercise,
  PlanExercise,
  SessionSet,
  Snapshot,
  WorkoutPlan,
  WorkoutSession,
} from '../data/types'
import { weekdayOf } from './dates'
import { normalize } from './notes'

export const DEFAULT_SETS = 3
export const DEFAULT_REPS = 10
export const DEFAULT_REST_SECONDS = 90
export const LOAD_STEP_KG = 2.5

const MINUTE_MS = 60_000

export type Exercise = { id: string; name: string; muscle: string; how: string }

export function allExercises(custom: CustomExercise[]): Exercise[] {
  const own = custom.map(({ id, name, muscle, instructions }) => ({
    id,
    name,
    muscle,
    how: instructions,
  }))
  return [...own, ...EXERCISES]
}

/** Exercício de uma série antiga pode ter saído da lista: o registro continua valendo. */
export function exerciseOf(ref: string, custom: CustomExercise[]): Exercise {
  return (
    allExercises(custom).find((exercise) => exercise.id === ref) ?? {
      id: ref,
      name: 'Exercício removido',
      muscle: '',
      how: '',
    }
  )
}

export function findExercises(list: Exercise[], query: string, muscle: string | null): Exercise[] {
  const wanted = normalize(query)
  return list.filter(
    (exercise) =>
      (!muscle || exercise.muscle === muscle) &&
      (!wanted || normalize(exercise.name).includes(wanted)),
  )
}

export const formatLoad = (kg: number | null) =>
  kg === null ? 'Sem carga' : `${String(kg).replace('.', ',')} kg`

export const activePlans = (snapshot: Snapshot): WorkoutPlan[] =>
  snapshot.workoutPlans
    .filter((plan) => !plan.archivedAt)
    .sort((a, b) => a.position - b.position)

export const plansOn = (snapshot: Snapshot, date: string): WorkoutPlan[] =>
  activePlans(snapshot).filter((plan) => plan.weekdays.includes(weekdayOf(date)))

export const exercisesOf = (snapshot: Snapshot, planId: string): PlanExercise[] =>
  snapshot.planExercises
    .filter((exercise) => exercise.planId === planId)
    .sort((a, b) => a.position - b.position)

export const musclesOf = (snapshot: Snapshot, planId: string): string =>
  [
    ...new Set(
      exercisesOf(snapshot, planId).flatMap(({ exerciseRef }) => {
        const { muscle } = exerciseOf(exerciseRef, snapshot.customExercises)
        return muscle ? [muscle] : []
      }),
    ),
  ].join(', ')

/** Sessão aberta. Fica no banco, então um treino começado no celular aparece no computador. */
export const runningSession = (snapshot: Snapshot): WorkoutSession | null =>
  snapshot.workoutSessions.findLast((session) => !session.finishedAt) ?? null

export const finishedSessions = (snapshot: Snapshot): WorkoutSession[] =>
  snapshot.workoutSessions
    .filter((session) => session.finishedAt)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))

export const setsOf = (snapshot: Snapshot, sessionId: string): SessionSet[] =>
  snapshot.sessionSets
    .filter((set) => set.sessionId === sessionId)
    .sort((a, b) => a.position - b.position)

export type SessionSummary = { minutes: number; sets: number; volume: number }

export function summarize(session: WorkoutSession, sets: SessionSet[], now: string): SessionSummary {
  const end = new Date(session.finishedAt ?? now).getTime()
  const volume = sets.reduce((sum, { reps, loadKg }) => sum + reps * (loadKg ?? 0), 0)
  return {
    minutes: Math.max(1, Math.round((end - new Date(session.startedAt).getTime()) / MINUTE_MS)),
    sets: sets.length,
    volume: Math.round(volume),
  }
}

export type SessionExercise = {
  ref: string
  planned: PlanExercise | null
  /** Séries combinadas. Série a mais conta em `done`, sem mudar a ficha. */
  target: number
  done: SessionSet[]
}

/** O que a ficha pede mais o que foi feito. Exercício tirado da ficha no meio do treino continua. */
export function sessionExercises(snapshot: Snapshot, session: WorkoutSession): SessionExercise[] {
  const planned = exercisesOf(snapshot, session.planId)
  const sets = setsOf(snapshot, session.id)
  const extras = [...new Set(sets.map((set) => set.exerciseRef))].filter(
    (ref) => !planned.some((exercise) => exercise.exerciseRef === ref),
  )

  return [
    ...planned.map((exercise) => ({
      ref: exercise.exerciseRef,
      planned: exercise,
      target: exercise.sets,
      done: sets.filter((set) => set.exerciseRef === exercise.exerciseRef),
    })),
    ...extras.map((ref) => {
      const done = sets.filter((set) => set.exerciseRef === ref)
      return { ref, planned: null, target: done.length, done }
    }),
  ]
}

function earlierSets(snapshot: Snapshot, ref: string, session: WorkoutSession): SessionSet[] {
  const earlier = finishedSessions(snapshot).filter((item) => item.startedAt < session.startedAt)
  for (const previous of earlier.reverse()) {
    const sets = setsOf(snapshot, previous.id).filter((set) => set.exerciseRef === ref)
    if (sets.length > 0) return sets
  }
  return []
}

export type SetDraft = { reps: number; loadKg: number | null }

/** Repetir o que foi feito é o caso comum: a série anterior, ou a mesma do último treino, ou a ficha. */
export function nextDraft(
  snapshot: Snapshot,
  session: WorkoutSession,
  { ref, planned, done }: SessionExercise,
): SetDraft {
  const last = done.at(-1)
  if (last) return { reps: last.reps, loadKg: last.loadKg }

  const earlier = earlierSets(snapshot, ref, session)[0]
  if (earlier) return { reps: earlier.reps, loadKg: earlier.loadKg }
  return { reps: planned?.reps ?? DEFAULT_REPS, loadKg: planned?.loadKg ?? null }
}

export type WorkoutRecord = { sessionId: string; date: string; exerciseRef: string; loadKg: number }

/**
 * Vale uma vez por exercício e por treino, ao passar da maior carga anterior. O
 * primeiro registro de um exercício não é recorde: ainda não há o que superar.
 * Sessão aberta não conta, para desfazer uma série não mexer no XP.
 */
export function recordsOf(snapshot: Snapshot): WorkoutRecord[] {
  const best = new Map<string, number>()
  const records: WorkoutRecord[] = []

  for (const session of finishedSessions(snapshot)) {
    const top = new Map<string, number>()
    for (const { exerciseRef, loadKg } of setsOf(snapshot, session.id)) {
      if (loadKg) top.set(exerciseRef, Math.max(top.get(exerciseRef) ?? 0, loadKg))
    }

    for (const [exerciseRef, loadKg] of top) {
      const previous = best.get(exerciseRef)
      if (previous !== undefined && loadKg > previous) {
        records.push({ sessionId: session.id, date: session.date, exerciseRef, loadKg })
      }
      best.set(exerciseRef, Math.max(previous ?? 0, loadKg))
    }
  }

  return records
}

/** Maior carga dos treinos anteriores a esta sessão. Nulo na primeira vez. */
export function bestBefore(snapshot: Snapshot, ref: string, session: WorkoutSession): number | null {
  const earlier = new Set(
    finishedSessions(snapshot)
      .filter((item) => item.startedAt < session.startedAt)
      .map((item) => item.id),
  )
  const loads = snapshot.sessionSets
    .filter((set) => earlier.has(set.sessionId) && set.exerciseRef === ref && set.loadKg)
    .map((set) => set.loadKg ?? 0)
  return loads.length > 0 ? Math.max(...loads) : null
}

export type LoadPoint = { date: string; value: number }

/** Maior carga de cada treino, para o gráfico do exercício. */
export function loadHistory(snapshot: Snapshot, ref: string): LoadPoint[] {
  return finishedSessions(snapshot).flatMap(({ id, date }) => {
    const loads = setsOf(snapshot, id)
      .filter((set) => set.exerciseRef === ref && set.loadKg)
      .map((set) => set.loadKg ?? 0)
    return loads.length > 0 ? [{ date, value: Math.max(...loads) }] : []
  })
}

/** Maior carga de cada exercício já feito, com a mais recente primeiro. */
export function personalBests(snapshot: Snapshot): { ref: string; date: string; value: number }[] {
  const bests = new Map<string, LoadPoint>()
  for (const { id, date } of finishedSessions(snapshot)) {
    for (const { exerciseRef, loadKg } of setsOf(snapshot, id)) {
      if (loadKg && loadKg > (bests.get(exerciseRef)?.value ?? 0)) {
        bests.set(exerciseRef, { date, value: loadKg })
      }
    }
  }
  return [...bests]
    .map(([ref, point]) => ({ ref, ...point }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export const workoutsOn = (snapshot: Snapshot) => {
  const counts = new Map<string, number>()
  for (const { date } of finishedSessions(snapshot)) counts.set(date, (counts.get(date) ?? 0) + 1)
  return (date: string) => counts.get(date) ?? 0
}

export type WorkoutDay = 'done' | 'planned' | 'rest'

/** Dia passado sem treino vira descanso: o calendário não cobra o que já foi. */
export function workoutDay(snapshot: Snapshot, date: string, today: string): WorkoutDay {
  if (workoutsOn(snapshot)(date) > 0) return 'done'
  return date >= today && plansOn(snapshot, date).length > 0 ? 'planned' : 'rest'
}
