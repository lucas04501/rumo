import { describe, expect, it } from 'vitest'
import { effectiveTier, FREE_MAX_HABITS, limitsOf, resolvePlan, type PlanInfo, type Subscription } from './plan'

const on = { enabled: true }
const end = new Date('2026-12-17T12:00:00Z')
const sub = (overrides: Partial<Subscription> = {}): Subscription => ({
  status: 'active',
  currentPeriodEnd: end,
  cancelAtPeriodEnd: false,
  ...overrides,
})

describe('resolvePlan', () => {
  it('dá tudo a todos enquanto a cobrança está desligada', () => {
    const plan = resolvePlan({ billing: { enabled: false }, subscription: null })
    expect(plan).toMatchObject({ tier: 'pro', billing: false, trialEndsAt: null })
  })

  it('quem nunca assinou é grátis e ainda tem os 7 dias de teste', () => {
    expect(resolvePlan({ billing: on, subscription: null })).toMatchObject({
      tier: 'free',
      billing: true,
      trialAvailable: true,
    })
  })

  it('o teste só existe com a assinatura em trialing, e acaba no fim do período', () => {
    const plan = resolvePlan({ billing: on, subscription: sub({ status: 'trialing' }) })
    expect(plan).toMatchObject({ tier: 'pro', trialAvailable: false, trialEndsAt: end.toISOString(), periodEnd: end.toISOString() })
  })

  it('assinatura ativa é Pro, sem teste', () => {
    expect(resolvePlan({ billing: on, subscription: sub() })).toMatchObject({
      tier: 'pro',
      trialEndsAt: null,
      periodEnd: end.toISOString(),
    })
  })

  it('pagamento atrasado segue Pro enquanto a Stripe tenta de novo', () => {
    expect(resolvePlan({ billing: on, subscription: sub({ status: 'past_due', currentPeriodEnd: null }) }).tier).toBe('pro')
  })

  it('assinatura cancelada volta ao grátis e não ganha outro teste', () => {
    for (const status of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired']) {
      expect(resolvePlan({ billing: on, subscription: sub({ status }) })).toMatchObject({
        tier: 'free',
        trialAvailable: false,
      })
    }
  })
})

describe('limitsOf', () => {
  it('o grátis tem limite de hábitos e não tem treinos', () => {
    expect(limitsOf('free')).toEqual({ maxHabits: FREE_MAX_HABITS, treinos: false })
  })

  it('o Pro não tem limite', () => {
    expect(limitsOf('pro')).toEqual({ maxHabits: null, treinos: true })
  })
})

describe('effectiveTier', () => {
  const pro: PlanInfo = {
    tier: 'pro',
    billing: true,
    trialAvailable: false,
    trialEndsAt: null,
    periodEnd: '2027-01-10T00:00:00.000Z',
    cancelAtPeriodEnd: true,
  }

  it('rebaixa um Pro cancelado depois do fim do período', () => {
    expect(effectiveTier(pro, new Date('2027-01-11T00:00:00Z'))).toBe('free')
    expect(effectiveTier(pro, new Date('2027-01-09T00:00:00Z'))).toBe('pro')
  })

  it('mantém um Pro que renova, mesmo com a data velha na foto', () => {
    expect(effectiveTier({ ...pro, cancelAtPeriodEnd: false }, new Date('2027-03-01T00:00:00Z'))).toBe('pro')
  })
})
