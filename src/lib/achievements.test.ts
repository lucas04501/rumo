import { describe, expect, it } from 'vitest'
import type { Habit, Snapshot, Task } from '../data/types'
import { achievementViews, ACHIEVEMENTS, totals, unseenAchievements } from './achievements'
import { addDays } from './dates'
import { periodStats } from './evolution'
import { indexSnapshot } from './progress'
import { complete } from './snapshot'
import { bestStreak, currentStreak } from './streaks'
import { newTask } from './tasks'

const TODAY = '2026-11-02'

const habit = (id: string, startDate: string, weekdays = [0, 1, 2, 3, 4, 5, 6]): Habit => ({
  id,
  title: id,
  icon: 'book',
  weekdays,
  startDate,
  goalId: null,
  archivedAt: null,
  position: 0,
})

const snapshotOf = (fields: Partial<Snapshot>): Snapshot =>
  complete({
    user: { name: '' },
    goals: [],
    milestones: [],
    habits: [],
    pauses: [],
    checks: [],
    tasks: [],
    days: [],
    ...fields,
  })

const checksOn = (habitId: string, ...dates: string[]) => dates.map((date) => ({ habitId, date }))

const lastDays = (count: number) => Array.from({ length: count }, (_, day) => addDays(TODAY, -day))

describe('bestStreak', () => {
  it('guarda a maior sequência, mesmo depois de ela acabar', () => {
    const plan = habit('a', '2026-10-01')
    const run = Array.from({ length: 8 }, (_, day) => addDays('2026-10-01', day))
    expect(bestStreak(plan, new Set(run), TODAY)).toBe(8)
  })

  it('segue a mesma regra da âncora da sequência atual em qualquer dia', () => {
    const plan = habit('a', '2026-08-01', [0, 1, 2, 3, 4, 6])
    // Padrão fixo com faltas soltas e faltas próximas, para não depender de sorteio.
    const checks = new Set(
      Array.from({ length: 90 }, (_, day) => addDays('2026-08-01', day)).filter(
        (_, day) => day % 11 !== 4 && day % 23 !== 5 && day % 23 !== 7,
      ),
    )

    let expected = 0
    for (let date = plan.startDate; date <= TODAY; date = addDays(date, 1)) {
      expected = Math.max(expected, currentStreak(plan, checks, date).days)
    }
    expect(bestStreak(plan, checks, TODAY)).toBe(expected)
  })

  it('hoje em aberto não quebra', () => {
    const plan = habit('a', addDays(TODAY, -3))
    expect(bestStreak(plan, new Set(lastDays(4).slice(1)), TODAY)).toBe(3)
  })
})

describe('totals', () => {
  const tasks: Task[] = [
    newTask({ id: 't1', date: TODAY, title: 'a', position: 0, doneAt: `${TODAY}T12:00:00Z` }),
    newTask({ id: 't2', date: addDays(TODAY, -4), title: 'b', position: 1, doneAt: `${TODAY}T12:00:00Z` }),
    newTask({ id: 't3', date: TODAY, title: 'c', position: 2 }),
  ]
  const snapshot = snapshotOf({
    habits: [habit('a', addDays(TODAY, -9))],
    checks: checksOn('a', ...lastDays(5)),
    tasks,
  })

  it('usa os mesmos números da Evolução', () => {
    const dates = Array.from({ length: 10 }, (_, day) => addDays(TODAY, day - 9))
    const stats = periodStats(snapshot, indexSnapshot(snapshot), dates)
    const reached = totals(snapshot, TODAY)

    expect(reached.habits).toBe(stats.habitDone)
    expect(reached.tasks).toBe(stats.taskDone)
    expect(reached).toMatchObject({ habits: 5, tasks: 2, streak: 5 })
  })
})

describe('unseenAchievements', () => {
  const snapshot = snapshotOf({
    habits: [habit('a', addDays(TODAY, -7))],
    checks: checksOn('a', ...lastDays(7)),
  })

  it('traz o que foi alcançado e ainda não tocou', () => {
    expect(unseenAchievements(snapshot, TODAY).map(({ id }) => id)).toEqual([
      'sequencia-7',
      'perfeito-1',
      'habitos-1',
    ])
  })

  it('não repete o que já tocou', () => {
    const seen = { ...snapshot, achievementsSeen: ['sequencia-7', 'perfeito-1', 'habitos-1'] }
    expect(unseenAchievements(seen, TODAY)).toEqual([])
  })
})

describe('achievementViews', () => {
  it('medalha ganha fica, mesmo que o número caia depois', () => {
    const views = achievementViews({ ...snapshotOf({}), achievementsSeen: ['tarefas-1'] }, TODAY)
    expect(views.find(({ id }) => id === 'tarefas-1')).toMatchObject({ earned: true, value: 0 })
    expect(views.find(({ id }) => id === 'tarefas-50')?.earned).toBe(false)
  })

  it('todo ID cabe na regra da rota e não se repete', () => {
    const ids = ACHIEVEMENTS.map(({ id }) => id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^[a-z0-9-]{1,64}$/.test(id))).toBe(true)
  })
})
