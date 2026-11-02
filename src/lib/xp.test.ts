import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { XP, hasTailwind, rankFor, totalXp } from './xp'

const empty = { checks: [], tasksDone: 0, perfectDays: 0, milestonesDone: 0, goalsDone: 0 }

describe('hasTailwind', () => {
  it('dá sempre o mesmo resultado para o mesmo hábito e dia', () => {
    expect(hasTailwind('treinar', '2026-11-02')).toBe(hasTailwind('treinar', '2026-11-02'))
  })

  it('acontece em cerca de 1 a cada 8 checks', () => {
    let hits = 0
    const days = 4000
    for (let i = 0; i < days; i += 1) {
      if (hasTailwind('treinar', addDays('2020-01-01', i))) hits += 1
    }
    expect(hits / days).toBeGreaterThan(0.1)
    expect(hits / days).toBeLessThan(0.15)
  })
})

describe('totalXp', () => {
  it('soma cada tipo de conquista', () => {
    const xp = totalXp({
      checks: [],
      tasksDone: 2,
      perfectDays: 1,
      milestonesDone: 1,
      goalsDone: 1,
    })
    expect(xp).toBe(2 * XP.task + XP.perfectDay + XP.milestone + XP.goal)
  })

  it('soma o bônus de vento a favor só nos checks com sorte', () => {
    const dates = Array.from({ length: 400 }, (_, i) => addDays('2026-01-01', i))
    const lucky = dates.find((date) => hasTailwind('a', date))!
    const unlucky = dates.find((date) => !hasTailwind('a', date))!

    expect(totalXp({ ...empty, checks: [{ habitId: 'a', date: lucky }] })).toBe(XP.habit + XP.tailwind)
    expect(totalXp({ ...empty, checks: [{ habitId: 'a', date: unlucky }] })).toBe(XP.habit)
  })

  it('desmarcar e remarcar não muda o total', () => {
    const before = [{ habitId: 'a', date: '2026-11-02' }]
    const unchecked: typeof before = []
    const rechecked = [{ habitId: 'a', date: '2026-11-02' }]
    expect(totalXp({ ...empty, checks: unchecked })).toBe(0)
    expect(totalXp({ ...empty, checks: rechecked })).toBe(totalXp({ ...empty, checks: before }))
  })
})

describe('rankFor', () => {
  it('começa como Grumete', () => {
    expect(rankFor(0)).toEqual({ name: 'Grumete', progress: 0 })
  })

  it('sobe de patente no limite exato', () => {
    expect(rankFor(499).name).toBe('Grumete')
    expect(rankFor(500)).toEqual({ name: 'Marinheiro', progress: 0 })
  })

  it('mede o avanço até a próxima patente', () => {
    expect(rankFor(250).progress).toBe(0.5)
  })

  it('Almirante é o topo e fica com a barra cheia', () => {
    expect(rankFor(99_000)).toEqual({ name: 'Almirante', progress: 1 })
  })
})
