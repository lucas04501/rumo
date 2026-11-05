import { describe, expect, it } from 'vitest'
import type { Goal, Habit, Milestone, SessionSet, Snapshot, WorkoutSession } from '../data/types'
import { achievementViews } from './achievements'
import { addDays } from './dates'
import { complete } from './snapshot'
import { timelineOf } from './timeline'
import { exerciseOf } from './workouts'

const TODAY = '2026-11-02'

const snapshotOf = (fields: Partial<Snapshot> = {}): Snapshot => ({
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
  ...fields,
})

const habit: Habit = {
  id: 'a',
  title: 'Ler',
  icon: 'book',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  startDate: '2026-10-01',
  goalId: null,
  archivedAt: null,
  position: 0,
}

const goal = (id: string, doneAt: string | null): Goal => ({
  id,
  title: `Meta ${id}`,
  why: null,
  targetDate: null,
  status: doneAt ? 'done' : 'active',
  doneAt,
  position: 0,
})

const session = (id: string, date: string): WorkoutSession => ({
  id,
  planId: 'p',
  date,
  startedAt: `${date}T10:00:00.000Z`,
  finishedAt: `${date}T10:45:00.000Z`,
  notes: null,
})

const set = (sessionId: string, loadKg: number): SessionSet => ({
  id: sessionId,
  sessionId,
  exerciseRef: 'supino-reto',
  position: 0,
  reps: 10,
  loadKg,
  doneAt: `${sessionId}T10:05:00.000Z`,
})

const ids = (events: ReturnType<typeof timelineOf>) => events.map(({ id }) => id)
const dateOf = (events: ReturnType<typeof timelineOf>, id: string) => events.find((event) => event.id === id)?.date

describe('timelineOf', () => {
  it('conta nova não tem história', () => {
    expect(timelineOf(snapshotOf(), TODAY)).toEqual([])
  })

  it('põe cada conquista no dia em que ela saiu, e a sequência no sétimo dia', () => {
    const checks = Array.from({ length: 8 }, (_, day) => ({ habitId: 'a', date: addDays('2026-10-01', day) }))
    const events = timelineOf(snapshotOf({ habits: [habit], checks }), TODAY)

    expect(dateOf(events, 'achievement:habitos-1')).toBe('2026-10-01')
    expect(dateOf(events, 'achievement:perfeito-1')).toBe('2026-10-01')
    expect(dateOf(events, 'achievement:sequencia-7')).toBe('2026-10-07')
    expect(dateOf(events, 'achievement:sequencia-30')).toBeUndefined()
  })

  it('mostra as conquistas ganhas e só elas', () => {
    const checks = Array.from({ length: 12 }, (_, day) => ({ habitId: 'a', date: addDays('2026-10-01', day) }))
    const snapshot = snapshotOf({
      habits: [habit],
      checks,
      goals: [goal('x', '2026-10-20T12:00:00')],
      workoutSessions: [session('2026-10-20', '2026-10-20')],
    })
    const earned = achievementViews(snapshot, TODAY).filter(({ earned }) => earned).map(({ id }) => `achievement:${id}`)
    const shown = ids(timelineOf(snapshot, TODAY)).filter((id) => id.startsWith('achievement:'))
    expect(shown.sort()).toEqual(earned.sort())
  })

  it('anuncia a patente no dia em que o XP cruza o limite', () => {
    const goals = [goal('1', '2026-10-10T12:00:00'), goal('2', '2026-10-11T12:00:00'), goal('3', '2026-10-12T12:00:00')]
    const events = timelineOf(snapshotOf({ goals }), TODAY)
    // 200, 400 e 600 XP: Marinheiro começa em 500.
    expect(events.filter(({ kind }) => kind === 'rank')).toEqual([
      { id: 'rank:1', date: '2026-10-12', kind: 'rank', title: 'Marinheiro', detail: 'Nova patente' },
    ])
    expect(dateOf(events, 'achievement:meta-3')).toBe('2026-10-12')
  })

  it('traz marcos com a meta, recordes de carga e treinos', () => {
    const milestone: Milestone = { id: 'm', goalId: 'x', title: 'Primeira fase', position: 0, doneAt: '2026-10-15T09:00:00' }
    const snapshot = snapshotOf({
      goals: [goal('x', null)],
      milestones: [milestone],
      workoutPlans: [
        { id: 'p', title: 'Treino A', weekdays: [], habitId: null, goalId: null, archivedAt: null, position: 0 },
      ],
      workoutSessions: [session('2026-10-20', '2026-10-20'), session('2026-10-23', '2026-10-23')],
      sessionSets: [set('2026-10-20', 60), set('2026-10-23', 65)],
    })
    const events = timelineOf(snapshot, TODAY)

    expect(events.find(({ id }) => id === 'milestone:m')?.detail).toBe('Marco · Meta x')
    const record = events.find(({ kind }) => kind === 'record')
    expect(record).toMatchObject({ date: '2026-10-23', title: exerciseOf('supino-reto', []).name, detail: 'Recorde de carga · 65 kg' })
    expect(events.filter(({ kind }) => kind === 'workout').map(({ title, detail }) => [title, detail])).toEqual([
      ['Treino A', 'Treino · 45 min · 1 série'],
      ['Treino A', 'Treino · 45 min · 1 série'],
    ])
    expect(dateOf(events, 'achievement:recorde-1')).toBe('2026-10-23')
  })

  it('vem do mais recente para o mais antigo', () => {
    const events = timelineOf(
      snapshotOf({ goals: [goal('1', '2026-10-10T12:00:00'), goal('2', '2026-10-20T12:00:00')] }),
      TODAY,
    )
    const dates = events.map(({ date }) => date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('marco concluído antes de qualquer hábito ou tarefa não é perdido', () => {
    const milestone: Milestone = { id: 'm', goalId: 'x', title: 'Cedo', position: 0, doneAt: '2026-01-05T09:00:00' }
    const events = timelineOf(snapshotOf({ goals: [goal('x', null)], milestones: [milestone] }), TODAY)
    expect(dateOf(events, 'milestone:m')).toBe('2026-01-05')
    expect(dateOf(events, 'achievement:marco-1')).toBe('2026-01-05')
  })
})
