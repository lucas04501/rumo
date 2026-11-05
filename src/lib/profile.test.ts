import { describe, expect, it } from 'vitest'
import type { Snapshot } from '../data/types'
import type { PlanInfo } from './plan'
import { activityOf, hasInvoices, initialsOf, planSummary } from './profile'
import { complete } from './snapshot'

const snapshotOf = (fields: Partial<Snapshot> = {}): Snapshot => ({
  ...complete({
    user: { name: '' },
    goals: [],
    milestones: [],
    habits: [],
    pauses: [],
    checks: [],
    tasks: [],
    days: [],
  }),
  ...fields,
})

const plan = (fields: Partial<PlanInfo>): PlanInfo => ({
  tier: 'free',
  billing: true,
  trialAvailable: true,
  trialEndsAt: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  ...fields,
})

describe('activityOf', () => {
  it('conta nova não tem nada, e nada quebra', () => {
    expect(activityOf(snapshotOf())).toEqual({ activeDays: 0, habitsDone: 0, workouts: 0, focusMinutes: 0 })
  })

  it('um dia com várias coisas conta uma vez, e treino aberto não conta', () => {
    const snapshot = snapshotOf({
      checks: [
        { habitId: 'a', date: '2026-10-01' },
        { habitId: 'b', date: '2026-10-01' },
        { habitId: 'a', date: '2026-10-02' },
      ],
      focusSessions: [
        { id: 'f', taskId: null, date: '2026-10-02', startedAt: '2026-10-02T10:00:00', minutes: 25, plannedMinutes: 25 },
        { id: 'g', taskId: null, date: '2026-10-05', startedAt: '2026-10-05T10:00:00', minutes: 30, plannedMinutes: 30 },
      ],
      workoutSessions: [
        { id: 's', planId: 'p', date: '2026-10-05', startedAt: '2026-10-05T09:00:00', finishedAt: '2026-10-05T09:40:00', notes: null },
        { id: 'o', planId: 'p', date: '2026-10-09', startedAt: '2026-10-09T09:00:00', finishedAt: null, notes: null },
      ],
    })
    expect(activityOf(snapshot)).toEqual({ activeDays: 3, habitsDone: 3, workouts: 1, focusMinutes: 55 })
  })
})

describe('initialsOf', () => {
  it('usa o primeiro e o último nome, em maiúscula', () => {
    expect(initialsOf('lucas silva')).toBe('LS')
    expect(initialsOf('  Ana  Maria de Souza ')).toBe('AS')
    expect(initialsOf('Ágatha')).toBe('Á')
  })

  it('nome vazio não tem iniciais', () => {
    expect(initialsOf('   ')).toBe('')
  })
})

describe('planSummary', () => {
  it('grátis oferece o teste só a quem nunca assinou', () => {
    expect(planSummary(plan({})).action).toBe('Teste 7 dias grátis')
    expect(planSummary(plan({ trialAvailable: false })).action).toBe('Ver o Pro')
    expect(planSummary(plan({})).line).toBe('Até 3 hábitos ativos.')
  })

  it('Pro em teste, ativo e cancelado dizem a data certa', () => {
    const pro = { tier: 'pro', trialAvailable: false } as const
    expect(planSummary(plan({ ...pro, trialEndsAt: '2026-11-09T15:00:00.000Z' })).line).toMatch(/^Teste grátis até 9 de novembro/)
    expect(planSummary(plan({ ...pro, periodEnd: '2026-12-02T15:00:00.000Z' })).line).toMatch(/^Próxima cobrança em 2 de dezembro/)
    expect(
      planSummary(plan({ ...pro, periodEnd: '2026-12-02T15:00:00.000Z', cancelAtPeriodEnd: true })).line,
    ).toMatch(/^Cancelada\. Segue até 2 de dezembro/)
  })

  it('só há faturas para quem já assinou', () => {
    expect(hasInvoices(plan({ trialAvailable: true }))).toBe(false)
    expect(hasInvoices(plan({ tier: 'pro', trialAvailable: false }))).toBe(true)
    expect(hasInvoices(plan({ billing: false, trialAvailable: false }))).toBe(false)
  })
})
