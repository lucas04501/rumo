import { describe, expect, it } from 'vitest'
import type { Habit, Snapshot } from '../data/types'
import { goalInFocus, habitsOn, summarizeDay, xpOf } from './progress'
import { newTask } from './tasks'
import { XP, hasTailwind } from './xp'

const MONDAY = '2026-11-02'

function habit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    title: id,
    icon: 'book',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    startDate: '2026-01-01',
    goalId: null,
    archivedAt: null,
    position: 0,
    ...overrides,
  }
}

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    user: { name: 'Teste' },
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
    notes: [],
    days: [],
    ...overrides,
  }
}

const task = (id: string, date: string, doneAt: string | null = null) =>
  newTask({ id, date, title: id, doneAt, position: 0 })

describe('habitsOn', () => {
  it('traz só os hábitos programados para o dia', () => {
    const data = snapshot({ habits: [habit('todo-dia'), habit('terca', { weekdays: [2] })] })
    expect(habitsOn(data, MONDAY).map((item) => item.id)).toEqual(['todo-dia'])
  })

  it('deixa de fora o hábito em pausa', () => {
    const data = snapshot({
      habits: [habit('pausado')],
      pauses: [{ id: 'p', habitId: 'pausado', startDate: MONDAY, endDate: MONDAY }],
    })
    expect(habitsOn(data, MONDAY)).toHaveLength(0)
  })

  it('não mistura os checks de hábitos diferentes', () => {
    const data = snapshot({
      habits: [habit('a'), habit('b')],
      checks: [{ habitId: 'a', date: MONDAY }],
    })
    const [a, b] = habitsOn(data, MONDAY)
    expect(a.done).toBe(true)
    expect(a.streak).toBe(1)
    expect(b.done).toBe(false)
  })
})

describe('summarizeDay', () => {
  it('dia sem nada não é perfeito e a maré fica baixa', () => {
    expect(summarizeDay(snapshot(), MONDAY)).toMatchObject({ level: 0, remaining: 0, perfect: false })
  })

  it('soma hábitos e só as tarefas daquele dia', () => {
    const data = snapshot({
      habits: [habit('a')],
      checks: [{ habitId: 'a', date: MONDAY }],
      tasks: [task('hoje', MONDAY), task('amanha', '2026-11-03')],
    })
    expect(summarizeDay(data, MONDAY)).toMatchObject({ done: 1, total: 2, level: 0.5, remaining: 1 })
  })

  it('fica perfeito quando tudo está concluído', () => {
    const data = snapshot({
      habits: [habit('a')],
      checks: [{ habitId: 'a', date: MONDAY }],
      tasks: [task('hoje', MONDAY, '2026-11-02T12:00:00Z')],
    })
    expect(summarizeDay(data, MONDAY).perfect).toBe(true)
  })
})

describe('xpOf', () => {
  it('soma checks, tarefas, dias perfeitos, marcos e metas', () => {
    const habitId = 'a'
    const data = snapshot({
      habits: [habit(habitId)],
      checks: [{ habitId, date: MONDAY }],
      tasks: [task('feita', MONDAY, '2026-11-02T12:00:00Z')],
      days: [
        { date: MONDAY, completedAt: '2026-11-02T12:00:00Z', note: null },
        { date: '2026-11-01', completedAt: null, note: 'só uma nota' },
      ],
    })
    const wind = hasTailwind(habitId, MONDAY) ? XP.tailwind : 0
    expect(xpOf(data)).toBe(XP.habit + wind + XP.task + XP.perfectDay)
  })
})

describe('xpOf com dia marcado à mão', () => {
  it('não dá o bônus de dia perfeito sem 100%', () => {
    const data = snapshot({
      habits: [habit('a')],
      days: [{ date: MONDAY, completedAt: '2026-11-02T12:00:00Z', note: null }],
    })
    expect(xpOf(data)).toBe(0)
  })
})

describe('goalInFocus', () => {
  const goal = (id: string, status: 'active' | 'done', doneAt: string | null = null) => ({
    id,
    title: id,
    why: null,
    targetDate: null,
    status,
    doneAt,
    position: 0,
  })

  it('sem metas, não há foco', () => {
    expect(goalInFocus(snapshot(), MONDAY)).toBeNull()
  })

  it('conta os marcos em ordem', () => {
    const data = snapshot({
      goals: [goal('g', 'active')],
      milestones: [
        { id: '2', goalId: 'g', title: 'B', position: 1, doneAt: null },
        { id: '1', goalId: 'g', title: 'A', position: 0, doneAt: '2026-11-01T12:00:00Z' },
      ],
    })
    const focus = goalInFocus(data, MONDAY)
    expect(focus?.milestones.map((item) => item.title)).toEqual(['A', 'B'])
    expect(focus?.reached).toBe(1)
  })

  it('mantém a meta concluída hoje, para o barco chegar', () => {
    const data = snapshot({ goals: [goal('g', 'done', '2026-11-02T15:00:00Z')] })
    expect(goalInFocus(data, MONDAY)?.id).toBe('g')
    expect(goalInFocus(data, '2026-11-03')).toBeNull()
  })
})
