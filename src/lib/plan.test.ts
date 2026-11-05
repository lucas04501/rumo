import { describe, expect, it } from 'vitest'
import { effectiveTier, FREE_MAX_HABITS, limitsOf, resolvePlan, trialEndsAt, type PlanInfo } from './plan'

const on = { enabled: true, startsAt: new Date('2026-12-01T00:00:00Z') }
const created = new Date('2026-12-10T12:00:00Z')

describe('trialEndsAt', () => {
  it('conta 7 dias do cadastro', () => {
    expect(trialEndsAt(created, on.startsAt).toISOString()).toBe('2026-12-17T12:00:00.000Z')
  })

  it('conta da virada da cobrança para quem já tinha conta', () => {
    const old = new Date('2026-11-02T12:00:00Z')
    expect(trialEndsAt(old, on.startsAt).toISOString()).toBe('2026-12-08T00:00:00.000Z')
  })
})

describe('resolvePlan', () => {
  const resolve = (overrides: Partial<Parameters<typeof resolvePlan>[0]>) =>
    resolvePlan({ billing: on, createdAt: created, subscription: null, now: new Date('2026-12-11T00:00:00Z'), ...overrides })

  it('dá tudo a todos enquanto a cobrança está desligada', () => {
    const plan = resolve({ billing: { ...on, enabled: false }, now: new Date('2030-01-01T00:00:00Z') })
    expect(plan.tier).toBe('pro')
    expect(plan.trialEndsAt).toBeNull()
  })

  it('começa no teste', () => {
    expect(resolve({}).tier).toBe('trial')
  })

  it('cai no grátis quando o teste acaba', () => {
    expect(resolve({ now: new Date('2026-12-17T12:00:00Z') }).tier).toBe('free')
  })

  it('assinatura ativa é Pro, mesmo com o teste vencido', () => {
    const plan = resolve({
      now: new Date('2027-02-01T00:00:00Z'),
      subscription: { status: 'active', currentPeriodEnd: new Date('2027-02-10T00:00:00Z'), cancelAtPeriodEnd: false },
    })
    expect(plan).toMatchObject({ tier: 'pro', periodEnd: '2027-02-10T00:00:00.000Z', trialEndsAt: null })
  })

  it('pagamento atrasado segue Pro enquanto a Stripe tenta de novo', () => {
    const subscription = { status: 'past_due', currentPeriodEnd: null, cancelAtPeriodEnd: false }
    expect(resolve({ subscription }).tier).toBe('pro')
  })

  it('assinatura cancelada volta ao grátis depois do teste', () => {
    const subscription = { status: 'canceled', currentPeriodEnd: null, cancelAtPeriodEnd: false }
    expect(resolve({ subscription, now: new Date('2027-02-01T00:00:00Z') }).tier).toBe('free')
  })

  it('assinatura cancelada ainda dentro do teste continua no teste', () => {
    const subscription = { status: 'canceled', currentPeriodEnd: null, cancelAtPeriodEnd: false }
    expect(resolve({ subscription }).tier).toBe('trial')
  })
})

describe('limitsOf', () => {
  it('o grátis tem limite de hábitos e não tem treinos', () => {
    expect(limitsOf('free')).toEqual({ maxHabits: FREE_MAX_HABITS, treinos: false })
  })

  it('teste e Pro não têm limite', () => {
    expect(limitsOf('trial')).toEqual({ maxHabits: null, treinos: true })
    expect(limitsOf('pro')).toEqual({ maxHabits: null, treinos: true })
  })
})

describe('effectiveTier', () => {
  const trial: PlanInfo = { tier: 'trial', trialEndsAt: '2026-12-17T12:00:00.000Z', periodEnd: null, cancelAtPeriodEnd: false }

  it('rebaixa um teste vencido guardado na foto', () => {
    expect(effectiveTier(trial, new Date('2026-12-18T00:00:00Z'))).toBe('free')
    expect(effectiveTier(trial, new Date('2026-12-16T00:00:00Z'))).toBe('trial')
  })

  it('rebaixa um Pro cancelado depois do fim do período', () => {
    const pro: PlanInfo = { tier: 'pro', trialEndsAt: null, periodEnd: '2027-01-10T00:00:00.000Z', cancelAtPeriodEnd: true }
    expect(effectiveTier(pro, new Date('2027-01-11T00:00:00Z'))).toBe('free')
  })

  it('mantém um Pro que renova, mesmo com a data velha na foto', () => {
    const pro: PlanInfo = { tier: 'pro', trialEndsAt: null, periodEnd: '2027-01-10T00:00:00.000Z', cancelAtPeriodEnd: false }
    expect(effectiveTier(pro, new Date('2027-03-01T00:00:00Z'))).toBe('pro')
  })
})
