import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { currentStreak, isStreakMark } from './streaks'

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const TODAY = '2026-11-02' // segunda-feira

const daysBefore = (...offsets: number[]) => new Set(offsets.map((n) => addDays(TODAY, -n)))
const habit = (weekdays = EVERY_DAY, startDate = '2026-01-01') => ({ weekdays, startDate })

describe('currentStreak', () => {
  it('conta dias seguidos terminando hoje', () => {
    expect(currentStreak(habit(), daysBefore(0, 1, 2), TODAY)).toEqual({ days: 3, anchorUsed: false })
  })

  it('a âncora só conta quando a falta fica dentro da sequência', () => {
    expect(currentStreak(habit(), daysBefore(0), TODAY).anchorUsed).toBe(false)
    expect(currentStreak(habit(), daysBefore(2, 3), TODAY)).toEqual({ days: 2, anchorUsed: true })
  })

  it('não quebra se hoje ainda não foi marcado', () => {
    expect(currentStreak(habit(), daysBefore(1, 2, 3), TODAY).days).toBe(3)
  })

  it('ignora os dias em que o hábito não está programado', () => {
    const mondayWednesdayFriday = habit([1, 3, 5])
    const checks = daysBefore(0, 3, 5, 7) // seg, sex, qua, seg
    expect(currentStreak(mondayWednesdayFriday, checks, TODAY)).toMatchObject({ days: 4 })
  })

  it('a âncora perdoa uma falta isolada', () => {
    const streak = currentStreak(habit(), daysBefore(0, 1, 3, 4), TODAY)
    expect(streak.days).toBe(4)
    expect(streak.anchorUsed).toBe(true)
  })

  it('uma falta antiga já não deixa a âncora em uso', () => {
    const checks = daysBefore(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12)
    expect(currentStreak(habit(), checks, TODAY)).toEqual({ days: 12, anchorUsed: false })
  })

  it('duas faltas em menos de 7 dias quebram a sequência', () => {
    expect(currentStreak(habit(), daysBefore(0, 1, 3, 5, 6), TODAY).days).toBe(3)
  })

  it('duas faltas com 7 dias de distância são perdoadas', () => {
    const checks = daysBefore(0, 1, 3, 4, 5, 6, 7, 8, 9, 11, 12)
    expect(currentStreak(habit(), checks, TODAY).days).toBe(11)
  })

  it('não conta nada antes do início do hábito', () => {
    const started = habit(EVERY_DAY, addDays(TODAY, -1))
    expect(currentStreak(started, daysBefore(0, 1, 2, 3), TODAY)).toEqual({ days: 2, anchorUsed: false })
  })

  it('uma pausa não quebra a sequência nem usa a âncora', () => {
    const paused = {
      ...habit(),
      pauses: [{ startDate: addDays(TODAY, -6), endDate: addDays(TODAY, -2) }],
    }
    expect(currentStreak(paused, daysBefore(0, 1, 7, 8), TODAY)).toEqual({ days: 4, anchorUsed: false })
  })

  it('hábito sem nenhum check tem sequência zero', () => {
    expect(currentStreak(habit(), new Set(), TODAY)).toEqual({ days: 0, anchorUsed: false })
  })
})

describe('isStreakMark', () => {
  it('destaca as sequências redondas e ignora as outras', () => {
    expect([7, 30, 100].every(isStreakMark)).toBe(true)
    expect([0, 1, 8, 29].some(isStreakMark)).toBe(false)
  })
})
