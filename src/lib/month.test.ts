import { describe, expect, it } from 'vitest'
import type { Habit, Snapshot } from '../data/types'
import { monthDays, monthGrid, monthInsights, shiftMonth, summarizeMonth } from './month'

const habit = (id: string, startDate = '2026-01-01'): Habit => ({
  id,
  title: id,
  icon: 'book',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  startDate,
  goalId: null,
  archivedAt: null,
  position: 0,
})

const snapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  user: { name: 'Teste' },
  goals: [],
  milestones: [],
  habits: [],
  pauses: [],
  checks: [],
  tasks: [],
  days: [],
  ...overrides,
})

const done = (date: string) => ({ date, completedAt: `${date}T12:00:00Z`, note: null })

describe('calendário', () => {
  it('atravessa o ano', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })

  it('sabe o tamanho do mês, inclusive em ano bissexto', () => {
    expect(monthDays('2026-11')).toHaveLength(30)
    expect(monthDays('2028-02')).toHaveLength(29)
  })

  it('a grade começa no domingo', () => {
    expect(monthGrid('2026-11')[0]).toBe('2026-11-01')
    const october = monthGrid('2026-10')
    expect(october.slice(0, 5)).toEqual([null, null, null, null, '2026-10-01'])
  })
})

describe('summarizeMonth', () => {
  const data = snapshot({
    habits: [habit('a', '2026-11-01')],
    checks: [
      { habitId: 'a', date: '2026-11-01' },
      { habitId: 'a', date: '2026-11-02' },
    ],
    days: [done('2026-11-01'), done('2026-11-02')],
  })

  it('conta só até hoje', () => {
    expect(summarizeMonth(data, '2026-11', '2026-11-04')).toMatchObject({
      daysDone: 2,
      daysElapsed: 4,
      consistency: 50,
      bestRun: 2,
    })
  })

  it('mês futuro fica zerado', () => {
    expect(summarizeMonth(data, '2026-12', '2026-11-04')).toMatchObject({ daysElapsed: 0, consistency: null })
  })

  it('dia da semana mais forte exige ao menos duas ocorrências', () => {
    expect(summarizeMonth(data, '2026-11', '2026-11-04').strongestWeekday).toBeNull()

    const many = snapshot({
      habits: [habit('a', '2026-11-01')],
      checks: [
        { habitId: 'a', date: '2026-11-03' },
        { habitId: 'a', date: '2026-11-10' },
      ],
    })
    expect(summarizeMonth(many, '2026-11', '2026-11-16').strongestWeekday).toBe('Terça')
  })
})

describe('monthInsights', () => {
  it('sem dados, não inventa frases', () => {
    expect(monthInsights(snapshot(), '2026-11', '2026-11-04')).toEqual([])
  })

  it('compara com o mês anterior', () => {
    const data = snapshot({
      habits: [habit('a', '2026-10-31')],
      checks: [
        { habitId: 'a', date: '2026-10-31' },
        { habitId: 'a', date: '2026-11-01' },
      ],
    })
    const lines = monthInsights(data, '2026-11', '2026-11-02')
    expect(lines).toContain('50 pontos abaixo de outubro.')
  })

  it('usa o singular no primeiro dia', () => {
    const data = snapshot({ habits: [habit('a', '2026-11-01')] })
    expect(monthInsights(data, '2026-11', '2026-11-01')[0]).toBe('0 de 1 dia concluído.')
  })
})
