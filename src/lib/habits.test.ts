import { describe, expect, it } from 'vitest'
import { describeWeekdays, isPaused, isScheduled } from './habits'

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const MONDAY = '2026-11-02'
const TUESDAY = '2026-11-03'

describe('isScheduled', () => {
  it('respeita os dias da semana escolhidos', () => {
    const habit = { weekdays: [1], startDate: '2026-01-01' }
    expect(isScheduled(habit, MONDAY)).toBe(true)
    expect(isScheduled(habit, TUESDAY)).toBe(false)
  })

  it('não conta antes de começar', () => {
    expect(isScheduled({ weekdays: EVERY_DAY, startDate: TUESDAY }, MONDAY)).toBe(false)
    expect(isScheduled({ weekdays: EVERY_DAY, startDate: TUESDAY }, TUESDAY)).toBe(true)
  })

  it('não conta durante uma pausa, incluindo o primeiro e o último dia', () => {
    const pauses = [{ startDate: '2026-11-02', endDate: '2026-11-04' }]
    const habit = { weekdays: EVERY_DAY, startDate: '2026-01-01', pauses }
    expect(isScheduled(habit, '2026-11-01')).toBe(true)
    expect(isScheduled(habit, '2026-11-02')).toBe(false)
    expect(isScheduled(habit, '2026-11-04')).toBe(false)
    expect(isScheduled(habit, '2026-11-05')).toBe(true)
  })

  it('hábito arquivado não conta', () => {
    const habit = { weekdays: EVERY_DAY, startDate: '2026-01-01', archivedAt: '2026-10-01T12:00:00Z' }
    expect(isScheduled(habit, MONDAY)).toBe(false)
  })
})

describe('isPaused', () => {
  it('sem pausas, nada está pausado', () => {
    expect(isPaused(MONDAY)).toBe(false)
  })
})

describe('describeWeekdays', () => {
  it('resume os casos comuns', () => {
    expect(describeWeekdays(EVERY_DAY)).toBe('Todos os dias')
    expect(describeWeekdays([1, 2, 3, 4, 5])).toBe('Segunda a sexta')
  })

  it('lista os dias em ordem', () => {
    expect(describeWeekdays([5, 1, 3])).toBe('Seg, Qua, Sex')
  })
})
