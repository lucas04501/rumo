import { describe, expect, it } from 'vitest'
import type { Habit, Snapshot } from '../data/types'
import { complete } from './snapshot'
import { hasAreaData, isProScreen, planView } from './planView'
import type { PlanInfo } from './plan'

const habit = (id: string, archivedAt: string | null = null) =>
  ({ id, title: id, icon: 'book', weekdays: [1], startDate: '2026-11-02', goalId: null, archivedAt, position: 0 }) as Habit

function snapshot(plan: PlanInfo, habits: Habit[]): Snapshot {
  return { ...complete({ user: { name: 'Ana' }, goals: [], milestones: [], habits: [], pauses: [], checks: [], days: [], tasks: [] }), plan, habits }
}

const free: PlanInfo = { tier: 'free', billing: true, trialAvailable: true, trialEndsAt: null, periodEnd: null, cancelAtPeriodEnd: false }
const pro: PlanInfo = { ...free, tier: 'pro' }

describe('planView', () => {
  it('sem foto, deixa o servidor decidir', () => {
    expect(planView(undefined)).toEqual({ habitRoom: true, pro: true })
  })

  it('o grátis tem vaga até o terceiro hábito ativo e não tem as áreas do Pro', () => {
    const two = [habit('a'), habit('b')]
    expect(planView(snapshot(free, two))).toEqual({ habitRoom: true, pro: false })
    expect(planView(snapshot(free, [...two, habit('c')])).habitRoom).toBe(false)
  })

  it('arquivar libera vaga', () => {
    expect(planView(snapshot(free, [habit('a'), habit('b'), habit('c', '2026-11-03T00:00:00Z')])).habitRoom).toBe(true)
  })

  it('o Pro não tem limite', () => {
    const many = Array.from({ length: 10 }, (_, i) => habit(`h${i}`))
    expect(planView(snapshot(pro, many))).toEqual({ habitRoom: true, pro: true })
  })

  it('um Pro cancelado e vencido na foto vale como grátis', () => {
    const canceled: PlanInfo = { ...pro, periodEnd: '2026-11-01T00:00:00Z', cancelAtPeriodEnd: true }
    expect(planView(snapshot(canceled, []), new Date('2026-11-05T00:00:00Z')).pro).toBe(false)
    expect(planView(snapshot(canceled, []), new Date('2026-10-30T00:00:00Z')).pro).toBe(true)
  })
})

describe('áreas do Pro', () => {
  it('reconhece as telas do Pro, inclusive as de dentro', () => {
    expect(isProScreen('/quadro')).toBe(true)
    expect(isProScreen('/treinos/abc')).toBe(true)
    expect(isProScreen('/')).toBe(false)
    expect(isProScreen('/habitos')).toBe(false)
    expect(isProScreen('/metas/abc')).toBe(false)
  })

  it('abre em leitura só quem tem algo seu na área', () => {
    const empty = snapshot(free, [])
    expect(hasAreaData(empty, '/notas')).toBe(false)
    expect(hasAreaData({ ...empty, days: [{ date: '2026-11-02', completedAt: null, note: 'oi' }] }, '/notas')).toBe(true)
    expect(hasAreaData({ ...empty, days: [{ date: '2026-11-02', completedAt: '2026-11-02T20:00:00Z', note: null }] }, '/notas')).toBe(false)
    // Evolução e Conquistas não guardam nada próprio: no grátis, é sempre o convite.
    expect(hasAreaData(empty, '/evolucao')).toBe(false)
  })
})
