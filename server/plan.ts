/**
 * Regra do plano. É pura e não importa nada, para o servidor e o app usarem o mesmo
 * arquivo (o app o reexporta em `src/lib/plan.ts`).
 *
 * - Trial: 7 dias de Pro a partir do cadastro, sem cartão.
 * - Pro: assinatura ativa na Stripe.
 * - Grátis: o resto. Mantém tudo o que já tem, mas não cria além do limite.
 */

export const TRIAL_DAYS = 7
export const FREE_MAX_HABITS = 3

export type Tier = 'trial' | 'pro' | 'free'

/** O que o servidor entrega na foto. `tier` vale para o instante em que ela foi montada. */
export type PlanInfo = {
  tier: Tier
  /** Instantes ISO. Só `trialEndsAt` existe fora do Pro, e só `periodEnd` no Pro. */
  trialEndsAt: string | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export type Limits = {
  /** `null` é sem limite. */
  maxHabits: number | null
  treinos: boolean
}

export type Subscription = {
  status: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

// `past_due` segue como Pro: a Stripe ainda tenta cobrar de novo e não faz sentido
// travar a pessoa no meio disso. Quando desiste, o status vira `canceled` ou `unpaid`.
const PAYING = new Set(['active', 'trialing', 'past_due'])

const DAY_MS = 86_400_000

export function limitsOf(tier: Tier): Limits {
  return tier === 'free' ? { maxHabits: FREE_MAX_HABITS, treinos: false } : { maxHabits: null, treinos: true }
}

/**
 * Fim do teste. Quem já tinha conta quando a cobrança ligou conta a partir de
 * `billingStartsAt`, não do cadastro, para não encontrar o teste já vencido.
 */
export function trialEndsAt(createdAt: Date, billingStartsAt: Date): Date {
  const start = Math.max(createdAt.getTime(), billingStartsAt.getTime())
  return new Date(start + TRIAL_DAYS * DAY_MS)
}

export function resolvePlan(input: {
  billing: { enabled: boolean; startsAt: Date }
  createdAt: Date
  subscription: Subscription | null
  now: Date
}): PlanInfo {
  const { billing, createdAt, subscription, now } = input

  // Cobrança desligada: todo mundo tem tudo, e nada muda para ninguém.
  if (!billing.enabled) return { tier: 'pro', trialEndsAt: null, periodEnd: null, cancelAtPeriodEnd: false }

  if (subscription && PAYING.has(subscription.status)) {
    return {
      tier: 'pro',
      trialEndsAt: null,
      periodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    }
  }

  const ends = trialEndsAt(createdAt, billing.startsAt)
  return {
    tier: now < ends ? 'trial' : 'free',
    trialEndsAt: ends.toISOString(),
    periodEnd: null,
    cancelAtPeriodEnd: false,
  }
}

/**
 * A foto fica no aparelho e abre sem internet, então o plano que ela traz pode ter
 * vencido. Isto só rebaixa, e só para a tela: quem decide de verdade é o servidor.
 */
export function effectiveTier(plan: PlanInfo, now: Date): Tier {
  if (plan.tier === 'trial' && plan.trialEndsAt && now >= new Date(plan.trialEndsAt)) return 'free'
  if (plan.tier === 'pro' && plan.cancelAtPeriodEnd && plan.periodEnd && now >= new Date(plan.periodEnd)) {
    return 'free'
  }
  return plan.tier
}
