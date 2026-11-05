import { describe, expect, it } from 'vitest'
import type { Habit, Snapshot, Task } from '../data/types'
import { addDays } from './dates'
import { calendarMarks, dayReport } from './dayReport'
import { indexSnapshot } from './progress'
import { newTask } from './tasks'
import { XP } from './xp'

// 2026-11-02 é uma segunda-feira.
const MONDAY = '2026-11-02'
const TODAY = '2026-11-05'

const noon = (date: string) => new Date(`${date}T12:00:00`).toISOString()

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
  plan: { tier: 'pro', billing: false, trialAvailable: false, trialEndsAt: null, periodEnd: null, cancelAtPeriodEnd: false },
  notes: [],
  days: [],
  ...overrides,
})

const report = (data: Snapshot, date = MONDAY) => dayReport(data, indexSnapshot(data), date, TODAY)

describe('dayReport', () => {
  it('resume o que foi feito no dia', () => {
    const data = snapshot({
      tasks: [task('feita', MONDAY, { doneAt: noon(MONDAY) }), task('aberta', MONDAY)],
      focusSessions: [
        { id: 'f', taskId: 'feita', date: MONDAY, startedAt: noon(MONDAY), minutes: 25, plannedMinutes: 25 },
      ],
      milestones: [{ id: 'm', goalId: 'g', title: '5 km', position: 0, doneAt: noon(MONDAY) }],
      goals: [
        {
          id: 'g',
          title: 'Correr',
          why: null,
          targetDate: null,
          status: 'done',
          doneAt: noon(MONDAY),
          position: 0,
        },
      ],
      notes: [
        { id: 'n', goalId: null, title: '', body: 'Ideia solta', pinned: false, updatedAt: noon(MONDAY) },
        { id: 'o', goalId: null, title: 'Outra', body: '', pinned: false, updatedAt: noon(TODAY) },
      ],
      routineSteps: [{ id: 's', weekday: 1, time: '07:00', title: 'Acordar', position: 0 }],
      routineChecks: [{ id: 'c', stepId: 's', date: MONDAY, doneAt: noon(MONDAY) }],
    })

    expect(report(data)).toMatchObject({
      percent: 50,
      done: 1,
      total: 2,
      xp: XP.task + XP.milestone + XP.goal,
      focus: { blocks: 1, minutes: 25, titles: ['feita'] },
      milestones: ['5 km'],
      goals: ['Correr'],
      notes: ['Ideia solta'],
    })
    expect(report(data).routine[0]).toMatchObject({ title: 'Acordar', done: true })
  })

  it('dia vazio não inventa número', () => {
    expect(report(snapshot())).toMatchObject({ percent: null, xp: 0, insights: [], routine: [] })
  })

  it('dia futuro mostra o planejado, sem frases', () => {
    const data = snapshot({
      tasks: [task('alta', '2026-11-20', { priority: 'high', doneAt: noon(TODAY) })],
      routineSteps: [{ id: 's', weekday: 5, time: '07:00', title: 'Acordar', position: 0 }],
    })
    const future = report(data, '2026-11-20')
    expect(future.insights).toEqual([])
    expect(future.routine).toHaveLength(1)
  })

  it('compara com a média do mesmo dia da semana', () => {
    const past = [7, 14, 21].map((back) => addDays(MONDAY, -back))
    const data = snapshot({
      tasks: [
        task('hoje', MONDAY, { doneAt: noon(MONDAY) }),
        ...past.flatMap((date) => [
          task(`${date}-a`, date, { doneAt: noon(date) }),
          task(`${date}-b`, date),
        ]),
      ],
    })
    expect(report(data).insights).toContain('50 pontos acima da sua média de segunda, que é 50%.')
  })

  it('não compara com poucos dias', () => {
    const data = snapshot({
      tasks: [
        task('hoje', MONDAY, { doneAt: noon(MONDAY) }),
        task('antes', addDays(MONDAY, -7)),
      ],
    })
    expect(report(data).insights.some((line) => line.includes('média'))).toBe(false)
  })

  it('aponta o melhor dia da semana já passada', () => {
    const data = snapshot({
      tasks: [
        task('a', '2026-11-01'),
        task('b', MONDAY, { doneAt: noon(MONDAY) }),
        task('c', '2026-11-03'),
      ],
    })
    expect(report(data).insights).toContain('Melhor dia da semana até aqui.')
    expect(report(data, '2026-11-03').insights).not.toContain('Melhor dia da semana até aqui.')
  })

  it('celebra marco de sequência no dia em que aconteceu', () => {
    const dates = Array.from({ length: 7 }, (_, back) => addDays(MONDAY, -back))
    const data = snapshot({
      habits: [habit('Ler', { startDate: dates[6] })],
      checks: dates.map((date) => ({ habitId: 'Ler', date })),
    })
    expect(report(data).insights).toContain('Ler chegou a 7 dias seguidos.')
    expect(report(data, addDays(MONDAY, -1)).insights).not.toContain('Ler chegou a 7 dias seguidos.')
  })

  it('reconhece as prioridades altas concluídas', () => {
    const data = snapshot({
      tasks: [
        task('a', MONDAY, { priority: 'high', doneAt: noon(MONDAY) }),
        task('b', MONDAY, { priority: 'high', doneAt: noon(MONDAY) }),
      ],
    })
    expect(report(data).insights).toContain('Todas as prioridades altas foram concluídas.')
  })

  it('aponta o dia com mais foco no mês', () => {
    const session = (date: string, minutes: number) => ({
      id: date,
      taskId: null,
      date,
      startedAt: noon(date),
      minutes,
      plannedMinutes: 25,
    })
    const data = snapshot({
      focusSessions: [session(MONDAY, 50), session('2026-10-20', 25)],
    })
    expect(report(data).insights).toContain('Seu dia com mais foco nos últimos 30 dias.')
    expect(report(data, '2026-10-20').insights).toEqual([])
  })
})

describe('calendarMarks', () => {
  it('marca dia com anotação e dia com foco', () => {
    const data = snapshot({
      days: [
        { date: MONDAY, completedAt: null, note: 'Foi bom' },
        { date: '2026-11-03', completedAt: null, note: '   ' },
      ],
      notes: [
        { id: 'n', goalId: null, title: 'X', body: '', pinned: false, updatedAt: noon('2026-11-04') },
      ],
      focusSessions: [
        { id: 'f', taskId: null, date: TODAY, startedAt: noon(TODAY), minutes: 5, plannedMinutes: 25 },
      ],
    })
    const { noted, focused } = calendarMarks(data)
    expect([...noted].sort()).toEqual([MONDAY, '2026-11-04'])
    expect([...focused]).toEqual([TODAY])
  })
})
