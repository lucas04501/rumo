import { describe, expect, it } from 'vitest'
import type { Habit, Snapshot, Task } from '../data/types'
import { addDays } from './dates'
import {
  buckets,
  dailySeries,
  depthOf,
  depthWeeks,
  focusMinutesOn,
  formatMinutes,
  habitTrends,
  headline,
  patterns,
  periodDates,
  periodStats,
  scoreDelta,
  smoothed,
  taskFocus,
  xpByDate,
} from './evolution'
import { indexSnapshot, xpOf } from './progress'
import { newTask } from './tasks'

const TODAY = '2026-11-18'

const habit = (id: string, overrides: Partial<Habit> = {}): Habit => ({
  id,
  title: id,
  icon: 'book',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  startDate: '2026-01-01',
  goalId: null,
  archivedAt: null,
  position: 0,
  ...overrides,
})

const task = (id: string, date: string, overrides: Partial<Task> = {}) =>
  newTask({ id, date, title: id, position: 0, ...overrides })

const snapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  user: { name: 'Ana' },
  goals: [],
  milestones: [],
  habits: [],
  pauses: [],
  checks: [],
  tasks: [],
  taskRules: [],
  subtasks: [],
  focusSessions: [],
  routineSteps: [],
  routineChecks: [],
  achievementsSeen: [],
  workoutPlans: [],
  planExercises: [],
  workoutSessions: [],
  sessionSets: [],
  customExercises: [],
  waterSettings: [],
  waterLogs: [],
  plan: { tier: 'pro', trialEndsAt: null, periodEnd: null, cancelAtPeriodEnd: false },
  notes: [],
  days: [],
  ...overrides,
})

const session = (date: string, minutes: number, hour = 9) => ({
  id: `${date}-${hour}`,
  taskId: null,
  date,
  startedAt: new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).toISOString(),
  minutes,
  plannedMinutes: 25,
})

describe('periodDates', () => {
  it('termina ontem e não conta hoje', () => {
    const dates = periodDates(TODAY, 7)
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-11-11')
    expect(dates[6]).toBe('2026-11-17')
  })

  it('o período anterior encosta no atual, sem repetir dia', () => {
    const previous = periodDates(TODAY, 7, 1)
    expect(previous[6]).toBe(addDays(periodDates(TODAY, 7)[0], -1))
  })
})

describe('xpByDate', () => {
  it('a soma dos dias é o XP total', () => {
    const data = snapshot({
      habits: [habit('h')],
      checks: [
        { habitId: 'h', date: '2026-11-15' },
        { habitId: 'h', date: '2026-11-16' },
      ],
      tasks: [task('t', '2026-11-16', { doneAt: new Date(2026, 10, 16, 12).toISOString() })],
      milestones: [
        { id: 'm', goalId: 'g', title: 'M', position: 0, doneAt: new Date(2026, 10, 16, 12).toISOString() },
      ],
      days: [{ date: '2026-11-16', completedAt: '2026-11-16T15:00:00Z', note: null }],
    })
    const total = [...xpByDate(data, indexSnapshot(data)).values()].reduce((sum, xp) => sum + xp, 0)
    expect(total).toBe(xpOf(data))
  })
})

describe('periodStats', () => {
  const done = new Date(2026, 10, 16, 12).toISOString()
  const data = snapshot({
    habits: [habit('h')],
    checks: [{ habitId: 'h', date: '2026-11-16' }],
    tasks: [task('feita', '2026-11-16', { doneAt: done }), task('aberta', '2026-11-16')],
    focusSessions: [session('2026-11-16', 25), session('2026-11-01', 50)],
  })

  it('soma hábitos, tarefas e foco só do período', () => {
    const stats = periodStats(data, indexSnapshot(data), periodDates(TODAY, 7))
    expect(stats).toMatchObject({
      habitDone: 1,
      habitTotal: 7,
      taskDone: 1,
      taskTotal: 2,
      focusMinutes: 25,
      focusBlocks: 1,
    })
    expect(stats.score).toBe(22)
  })

  it('sem nada programado, não inventa nota', () => {
    const empty = snapshot()
    const stats = periodStats(empty, indexSnapshot(empty), periodDates(TODAY, 7))
    expect(stats.score).toBeNull()
    expect(headline(stats.score, null)).toBe('Nada programado neste período.')
  })

  it('compara com o período anterior só quando há dados nos dois', () => {
    const empty = periodStats(snapshot(), indexSnapshot(snapshot()), periodDates(TODAY, 7))
    const stats = periodStats(data, indexSnapshot(data), periodDates(TODAY, 7))
    expect(scoreDelta(stats, empty)).toBeNull()
    expect(scoreDelta(stats, { ...stats, score: 10 })).toBe(12)
    expect(headline(40, 6)).toBe('6 pontos acima do período anterior.')
    expect(headline(40, -1)).toBe('1 ponto abaixo do período anterior.')
    expect(headline(40, 0)).toBe('No mesmo ritmo do período anterior.')
  })
})

describe('séries', () => {
  it('dia sem itens fica vazio, e não como zero', () => {
    const data = snapshot({ tasks: [task('t', '2026-11-16')] })
    const [empty, withTask] = dailySeries(indexSnapshot(data), ['2026-11-15', '2026-11-16'])
    expect(empty.level).toBeNull()
    expect(withTask).toMatchObject({ level: 0, total: 1, done: 0 })
  })

  it('suaviza a curva sem inventar dia', () => {
    const point = (level: number | null) => ({ date: TODAY, done: 0, total: 1, level })
    const series = [point(1), point(null), point(0), point(null)]
    expect(smoothed(series, 1)).toEqual([1, null, 0, null])
    expect(smoothed(series, 2)).toEqual([1, 1, 0, 0])
    expect(smoothed(series, 3)).toEqual([1, 1, 0.5, 0])
    expect(smoothed([point(null)], 7)).toEqual([null])
  })

  it('a carta termina na semana de hoje e deixa o futuro nulo', () => {
    const data = snapshot()
    const weeks = depthWeeks(indexSnapshot(data), TODAY, 3)
    expect(weeks).toHaveLength(3)
    expect(weeks[2].map((day) => day?.date ?? null)).toEqual([
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      null,
      null,
      null,
    ])
    expect(weeks[1][0]?.date).toBe('2026-11-08')
  })

  it('a profundidade separa dia cheio dos demais', () => {
    const point = { date: TODAY, done: 0, total: 0, level: null }
    expect(depthOf(point)).toBe('none')
    expect(depthOf({ ...point, done: 0, total: 4, level: 0 })).toBe('0')
    expect(depthOf({ ...point, done: 3, total: 4, level: 0.75 })).toBe('3')
    expect(depthOf({ ...point, done: 4, total: 4, level: 1 })).toBe('full')
  })

  it('agrupa por dia em 7 dias e por semana nos períodos longos', () => {
    const value = () => 1
    expect(buckets(periodDates(TODAY, 7), value, String)).toHaveLength(7)

    const weekly = buckets(periodDates(TODAY, 30), value, String)
    expect(weekly).toHaveLength(5)
    expect(weekly[0].value).toBe(2)
    expect(weekly[4].value).toBe(7)
  })

  it('soma os minutos de foco do dia', () => {
    const data = snapshot({
      focusSessions: [session('2026-11-16', 25, 9), session('2026-11-16', 10, 15)],
    })
    expect(focusMinutesOn(data)('2026-11-16')).toBe(35)
    expect(focusMinutesOn(data)('2026-11-15')).toBe(0)
  })

  it('formata minutos', () => {
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(60)).toBe('1 h')
    expect(formatMinutes(200)).toBe('3 h 20')
  })
})

describe('habitTrends', () => {
  it('mede o hábito e compara com o período anterior', () => {
    const checks = periodDates(TODAY, 7).map((date) => ({ habitId: 'h', date }))
    const data = snapshot({ habits: [habit('h')], checks })
    const [trend] = habitTrends(data, TODAY, 7)
    expect(trend).toMatchObject({ rate: 100, delta: 100, scheduled: 7, streak: 7 })
  })

  it('deixa arquivados de fora', () => {
    const data = snapshot({ habits: [habit('h', { archivedAt: '2026-11-01T12:00:00Z' })] })
    expect(habitTrends(data, TODAY, 7)).toEqual([])
  })
})

describe('taskFocus', () => {
  it('separa prioridade alta e recorrentes', () => {
    const data = snapshot({
      tasks: [
        task('a', '2026-11-16', { priority: 'high', doneAt: '2026-11-16T12:00:00Z' }),
        task('b', '2026-11-16', { priority: 'high' }),
        task('c', '2026-11-16', { ruleId: 'r' }),
      ],
    })
    expect(taskFocus(indexSnapshot(data), periodDates(TODAY, 7))).toEqual({
      high: { done: 1, total: 2 },
      repeating: { done: 0, total: 1 },
    })
  })
})

describe('patterns', () => {
  const dates = periodDates(TODAY, 30)

  it('com poucos dados, não diz nada', () => {
    const data = snapshot({ tasks: [task('t', '2026-11-16', { doneAt: '2026-11-16T12:00:00Z' })] })
    expect(patterns(data, indexSnapshot(data), TODAY, dates)).toEqual([])
  })

  it('aponta o dia mais forte quando a diferença é real', () => {
    const tasks = dates.map((date, position) =>
      task(`t${position}`, date, {
        doneAt: new Date(`${date}T12:00:00`).getDay() === 1 ? `${date}T12:00:00Z` : null,
      }),
    )
    const data = snapshot({ tasks })
    const [line] = patterns(data, indexSnapshot(data), TODAY, dates)
    expect(line).toContain('Segunda é seu dia mais forte')
  })

  it('não inventa diferença entre dias iguais', () => {
    const tasks = dates.map((date, position) => task(`t${position}`, date))
    const data = snapshot({ tasks })
    expect(patterns(data, indexSnapshot(data), TODAY, dates)).toEqual([
      'Seu ritmo é parecido em todos os dias da semana.',
    ])
  })

  it('compara dias com e sem foco', () => {
    const tasks = dates.map((date, position) =>
      task(`t${position}`, date, { doneAt: position % 2 === 0 ? `${date}T12:00:00Z` : null }),
    )
    const focusSessions = dates.filter((_, position) => position % 2 === 0).map((date) => session(date, 25))
    const data = snapshot({ tasks, focusSessions })
    const lines = patterns(data, indexSnapshot(data), TODAY, dates)
    expect(lines.some((line) => line.startsWith('Nos dias com foco, você cumpre 100%'))).toBe(true)
  })
})
