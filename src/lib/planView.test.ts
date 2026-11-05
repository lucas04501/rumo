import { describe, expect, it } from 'vitest'
import type { Habit, Snapshot } from '../data/types'
import { complete } from './snapshot'
import { planView } from './planView'
import type { PlanInfo } from './plan'

const habit = (id: string, archivedAt: string | null = null) =>
  ({ id, title: id, icon: 'book', weekdays: [1], startDate: '2026-11-02', goalId: null, archivedAt, position: 0 }) as Habit

function snapshot(plan: PlanInfo, habits: Habit[]): Snapshot {
  return { ...complete({ user: { name: 'Ana' }, goals: [], milestones: [], habits: [], pauses: [], checks: [], days: [], tasks: [] }), plan, habits }
}

const free: PlanInfo = { tier: 'free', trialEndsAt: null, periodEnd: null, cancelAtPeriodEnd: false }
const pro: PlanInfo = { ...free, tier: 'pro' }

describe('planView', () => {
  it('sem foto, deixa o servidor decidir', () => {
    expect(planView(undefined)).toEqual({ habitRoom: true, treinos: true })
  })

  it('o grátis tem vaga até o terceiro hábito ativo e não tem Treinos', () => {
    const two = [habit('a'), habit('b')]
    expect(planView(snapshot(free, two))).toEqual({ habitRoom: true, treinos: false })
    expect(planView(snapshot(free, [...two, habit('c')])).habitRoom).toBe(false)
  })

  it('arquivar libera vaga', () => {
    expect(planView(snapshot(free, [habit('a'), habit('b'), habit('c', '2026-11-03T00:00:00Z')])).habitRoom).toBe(true)
  })

  it('o Pro não tem limite', () => {
    const many = Array.from({ length: 10 }, (_, i) => habit(`h${i}`))
    expect(planView(snapshot(pro, many))).toEqual({ habitRoom: true, treinos: true })
  })

  it('um teste vencido na foto vale como grátis', () => {
    const expired: PlanInfo = { ...free, tier: 'trial', trialEndsAt: '2026-11-01T00:00:00Z' }
    expect(planView(snapshot(expired, []), new Date('2026-11-05T00:00:00Z')).treinos).toBe(false)
    expect(planView(snapshot(expired, []), new Date('2026-10-30T00:00:00Z')).treinos).toBe(true)
  })
})
