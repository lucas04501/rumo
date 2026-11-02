import { describe, expect, it } from 'vitest'
import { EXERCISES, MUSCLES } from '../content/exercicios'
import type { PlanExercise, SessionSet, Snapshot, WorkoutPlan, WorkoutSession } from '../data/types'
import { xpByDate } from './evolution'
import { indexSnapshot, xpOf } from './progress'
import { complete } from './snapshot'
import {
  allExercises,
  bestBefore,
  exerciseOf,
  findExercises,
  formatLoad,
  loadHistory,
  musclesOf,
  nextDraft,
  personalBests,
  plansOn,
  recordsOf,
  runningSession,
  sessionExercises,
  summarize,
  workoutDay,
} from './workouts'
import { XP } from './xp'

const plan: WorkoutPlan = {
  id: 'p',
  title: 'Treino A',
  weekdays: [1, 4],
  habitId: null,
  goalId: null,
  archivedAt: null,
  position: 0,
}

const exercise = (exerciseRef: string, fields: Partial<PlanExercise> = {}): PlanExercise => ({
  id: exerciseRef,
  planId: 'p',
  exerciseRef,
  position: 0,
  sets: 3,
  reps: 10,
  loadKg: null,
  restSeconds: 90,
  notes: null,
  ...fields,
})

const session = (id: string, date: string, finished = true): WorkoutSession => ({
  id,
  planId: 'p',
  date,
  startedAt: `${date}T10:00:00.000Z`,
  finishedAt: finished ? `${date}T10:45:00.000Z` : null,
  notes: null,
})

const set = (sessionId: string, exerciseRef: string, loadKg: number | null, position = 0): SessionSet => ({
  id: `${sessionId}-${exerciseRef}-${position}`,
  sessionId,
  exerciseRef,
  position,
  reps: 10,
  loadKg,
  doneAt: '2026-11-02T10:05:00.000Z',
})

const snapshotOf = (fields: Partial<Snapshot>): Snapshot => ({
  ...complete({
    user: { name: '' },
    goals: [],
    milestones: [],
    habits: [],
    pauses: [],
    checks: [],
    tasks: [],
    days: [],
  }),
  workoutPlans: [plan],
  ...fields,
})

describe('biblioteca', () => {
  it('tem IDs únicos e todo exercício tem grupo e instrução', () => {
    expect(new Set(EXERCISES.map(({ id }) => id)).size).toBe(EXERCISES.length)
    expect(EXERCISES.every(({ how, muscle }) => how.length > 20 && MUSCLES.includes(muscle))).toBe(true)
  })

  it('acha sem acento e por grupo, juntando os exercícios próprios', () => {
    const custom = [{ id: 'c', name: 'Remada na máquina', muscle: 'Costas', instructions: '' }]
    const list = allExercises(custom)
    expect(findExercises(list, 'maquina', null).map(({ id }) => id)).toEqual(['c'])
    expect(findExercises(list, '', 'Cardio').every(({ muscle }) => muscle === 'Cardio')).toBe(true)
  })

  it('exercício que saiu da lista não quebra o histórico', () => {
    expect(exerciseOf('sumiu', []).name).toBe('Exercício removido')
  })
})

describe('fichas', () => {
  it('lista as do dia e tira as arquivadas', () => {
    const archived = { ...plan, id: 'x', archivedAt: '2026-11-01T00:00:00.000Z' }
    const snapshot = snapshotOf({ workoutPlans: [plan, archived] })
    expect(plansOn(snapshot, '2026-11-02').map(({ id }) => id)).toEqual(['p'])
    expect(plansOn(snapshot, '2026-11-03')).toEqual([])
  })

  it('tira os grupos musculares dos exercícios, sem repetir', () => {
    const snapshot = snapshotOf({
      planExercises: [
        exercise('supino-reto'),
        exercise('crucifixo', { position: 1 }),
        exercise('triceps-corda', { position: 2 }),
      ],
    })
    expect(musclesOf(snapshot, 'p')).toBe('Peito, Tríceps')
  })
})

describe('sessão', () => {
  it('acha a sessão aberta', () => {
    const open = session('b', '2026-11-02', false)
    expect(runningSession(snapshotOf({ workoutSessions: [session('a', '2026-10-30'), open] }))).toBe(open)
    expect(runningSession(snapshotOf({ workoutSessions: [session('a', '2026-10-30')] }))).toBeNull()
  })

  it('junta a ficha com o que foi feito, e mantém exercício tirado da ficha', () => {
    const open = session('s', '2026-11-02', false)
    const snapshot = snapshotOf({
      planExercises: [exercise('supino-reto')],
      workoutSessions: [open],
      sessionSets: [set('s', 'supino-reto', 60), set('s', 'crucifixo', 12, 1)],
    })
    expect(
      sessionExercises(snapshot, open).map(({ ref, target, done }) => [ref, target, done.length]),
    ).toEqual([
      ['supino-reto', 3, 1],
      ['crucifixo', 1, 1],
    ])
  })

  it('sugere a série anterior, depois o último treino e por fim a ficha', () => {
    const open = session('s', '2026-11-02', false)
    const old = session('a', '2026-10-30')
    const planned = exercise('supino-reto', { reps: 8, loadKg: 40 })
    const fresh = snapshotOf({ planExercises: [planned], workoutSessions: [open] })
    const item = sessionExercises(fresh, open)[0]
    expect(nextDraft(fresh, open, item)).toEqual({ reps: 8, loadKg: 40 })

    const withHistory = { ...fresh, workoutSessions: [old, open], sessionSets: [set('a', 'supino-reto', 55)] }
    expect(nextDraft(withHistory, open, sessionExercises(withHistory, open)[0])).toEqual({ reps: 10, loadKg: 55 })

    const inSession = { ...withHistory, sessionSets: [...withHistory.sessionSets, set('s', 'supino-reto', 57.5)] }
    expect(nextDraft(inSession, open, sessionExercises(inSession, open)[0])).toEqual({ reps: 10, loadKg: 57.5 })
  })

  it('resume tempo, séries e volume', () => {
    const done = session('s', '2026-11-02')
    expect(summarize(done, [set('s', 'supino-reto', 60), set('s', 'supino-reto', null, 1)], '')).toEqual({
      minutes: 45,
      sets: 2,
      volume: 600,
    })
  })

  it('escreve a carga como se fala', () => {
    expect(formatLoad(22.5)).toBe('22,5 kg')
    expect(formatLoad(null)).toBe('Sem carga')
  })
})

describe('recordes', () => {
  const sessions = [session('a', '2026-10-20'), session('b', '2026-10-23'), session('c', '2026-10-27')]
  const sets = [
    set('a', 'supino-reto', 60),
    set('b', 'supino-reto', 62.5),
    set('b', 'supino-reto', 65, 1),
    set('c', 'supino-reto', 65),
    set('c', 'agachamento', 100),
    set('c', 'prancha', null),
  ]
  const snapshot = snapshotOf({ workoutSessions: sessions, sessionSets: sets })

  it('conta uma vez por treino, e não conta a primeira vez nem igualar', () => {
    expect(recordsOf(snapshot)).toEqual([
      { sessionId: 'b', date: '2026-10-23', exerciseRef: 'supino-reto', loadKg: 65 },
    ])
  })

  it('sessão aberta não vale recorde', () => {
    const open = session('d', '2026-11-02', false)
    const running = {
      ...snapshot,
      workoutSessions: [...sessions, open],
      sessionSets: [...sets, set('d', 'supino-reto', 80)],
    }
    expect(recordsOf(running)).toHaveLength(1)
    expect(bestBefore(running, 'supino-reto', open)).toBe(65)
    expect(bestBefore(running, 'crucifixo', open)).toBeNull()
  })

  it('soma XP uma vez, e o XP por dia continua batendo com o total', () => {
    const base = xpOf({ ...snapshot, sessionSets: [] })
    expect(xpOf(snapshot) - base).toBe(XP.record)

    const byDay = [...xpByDate(snapshot, indexSnapshot(snapshot)).values()]
    expect(byDay.reduce((sum, value) => sum + value, 0)).toBe(xpOf(snapshot))
  })

  it('monta o histórico de carga e a maior de cada exercício', () => {
    expect(loadHistory(snapshot, 'supino-reto')).toEqual([
      { date: '2026-10-20', value: 60 },
      { date: '2026-10-23', value: 65 },
      { date: '2026-10-27', value: 65 },
    ])
    expect(personalBests(snapshot)).toEqual([
      { ref: 'agachamento', date: '2026-10-27', value: 100 },
      { ref: 'supino-reto', date: '2026-10-23', value: 65 },
    ])
  })
})

describe('workoutDay', () => {
  const snapshot = snapshotOf({ workoutSessions: [session('a', '2026-10-29')] })

  it('separa feito, planejado e descanso, sem cobrar dia que passou', () => {
    expect(workoutDay(snapshot, '2026-10-29', '2026-11-02')).toBe('done')
    expect(workoutDay(snapshot, '2026-11-02', '2026-11-02')).toBe('planned')
    expect(workoutDay(snapshot, '2026-11-05', '2026-11-02')).toBe('planned')
    expect(workoutDay(snapshot, '2026-11-03', '2026-11-02')).toBe('rest')
    expect(workoutDay(snapshot, '2026-10-26', '2026-11-02')).toBe('rest')
  })
})
