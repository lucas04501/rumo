import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { consistency, deadlineLabel, goalProgress, milestoneChanges, paceSentence } from './goals'

const TODAY = '2026-11-02'
const done = { doneAt: '2026-11-01T12:00:00Z' }
const open = { doneAt: null }

describe('goalProgress', () => {
  it('mede o avanço só por marcos concluídos', () => {
    expect(goalProgress([done, done, open, open], null, TODAY)).toMatchObject({
      total: 4,
      reached: 2,
      remaining: 2,
      percent: 50,
    })
  })

  it('meta sem marcos fica em zero, sem dividir por zero', () => {
    expect(goalProgress([], null, TODAY).percent).toBe(0)
  })

  it('calcula o ritmo necessário até o prazo', () => {
    const progress = goalProgress([done, open, open, open], addDays(TODAY, 31), TODAY)
    expect(progress.daysLeft).toBe(31)
    expect(progress.daysPerMilestone).toBe(10)
  })

  it('o ritmo nunca fica abaixo de um dia por marco', () => {
    expect(goalProgress([open, open, open], addDays(TODAY, 1), TODAY).daysPerMilestone).toBe(1)
  })

  it('sem prazo ou com prazo vencido não há ritmo', () => {
    expect(goalProgress([open], null, TODAY).daysPerMilestone).toBeNull()
    expect(goalProgress([open], addDays(TODAY, -1), TODAY).daysPerMilestone).toBeNull()
  })
})

describe('deadlineLabel', () => {
  it('fala do prazo em português natural', () => {
    expect(deadlineLabel(41, false)).toBe('Faltam 41 dias')
    expect(deadlineLabel(1, false)).toBe('Falta 1 dia')
    expect(deadlineLabel(0, false)).toBe('Termina hoje')
    expect(deadlineLabel(-3, false)).toBe('Prazo encerrado')
    expect(deadlineLabel(null, false)).toBe('Sem prazo')
  })

  it('meta concluída não fala de prazo', () => {
    expect(deadlineLabel(-3, true)).toBe('Concluída')
  })
})

describe('paceSentence', () => {
  it('diz quanto falta e em que ritmo', () => {
    const progress = goalProgress([open, open, open], addDays(TODAY, 30), TODAY)
    expect(paceSentence(progress)).toBe('Faltam 3 marcos: 1 a cada 10 dias para chegar no prazo.')
  })

  it('usa o singular no último marco', () => {
    const progress = goalProgress([done, open], addDays(TODAY, 30), TODAY)
    expect(paceSentence(progress)).toBe('Falta 1 marco para chegar.')
  })

  it('sem marcos restantes ou sem prazo, não diz nada', () => {
    expect(paceSentence(goalProgress([done], addDays(TODAY, 30), TODAY))).toBeNull()
    expect(paceSentence(goalProgress([open], null, TODAY))).toBeNull()
  })
})

describe('consistency', () => {
  const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
  const plan = { weekdays: EVERY_DAY, startDate: addDays(TODAY, -10) }

  it('conta só os dias programados desde o início do hábito', () => {
    const checks = new Set([addDays(TODAY, -1), addDays(TODAY, -2)])
    expect(consistency(plan, checks, TODAY)).toEqual({ done: 2, scheduled: 10, percent: 20 })
  })

  it('hoje não conta, porque ainda está em aberto', () => {
    expect(consistency(plan, new Set([TODAY]), TODAY).done).toBe(0)
  })

  it('pausa não pesa contra a consistência', () => {
    const paused = {
      ...plan,
      pauses: [{ startDate: addDays(TODAY, -10), endDate: addDays(TODAY, -6) }],
    }
    expect(consistency(paused, new Set(), TODAY).scheduled).toBe(5)
  })

  it('hábito novo ainda não tem porcentagem', () => {
    const fresh = { weekdays: EVERY_DAY, startDate: TODAY }
    expect(consistency(fresh, new Set(), TODAY).percent).toBeNull()
  })
})

describe('milestoneChanges', () => {
  const milestone = (id: string, title: string, position: number) => ({
    id,
    goalId: 'g',
    title,
    position,
    doneAt: null,
  })

  it('sem mudança, não escreve nada', () => {
    const list = [milestone('a', 'A', 0)]
    expect(milestoneChanges(list, [...list])).toEqual({ changed: [], removed: [] })
  })

  it('detecta novo, renomeado, movido e removido', () => {
    const before = [milestone('a', 'A', 0), milestone('b', 'B', 1), milestone('c', 'C', 2)]
    const after = [milestone('b', 'B', 0), milestone('a', 'A2', 1), milestone('d', 'D', 2)]
    const { changed, removed } = milestoneChanges(before, after)
    expect(changed.map((item) => item.id)).toEqual(['b', 'a', 'd'])
    expect(removed.map((item) => item.id)).toEqual(['c'])
  })
})
