/**
 * Regra do plano. É pura e não importa nada, para o servidor e o app usarem o mesmo
 * arquivo (o app o reexporta em `src/lib/plan.ts`).
 *
 * - Pro: assinatura na Stripe em `trialing`, `active` ou `past_due`. Os 7 dias grátis são
 *   da própria assinatura: só começam com o cartão informado, e a cobrança vem depois.
 * - Grátis: o resto. Mantém tudo o que já tem, mas não cria além do limite.
 */

export const TRIAL_DAYS = 7
export const FREE_MAX_HABITS = 3

export type Tier = 'pro' | 'free'

/** O que o servidor entrega na foto. `tier` vale para o instante em que ela foi montada. */
export type PlanInfo = {
  tier: Tier
  /** Cobrança ligada. Desligada, todo mundo é Pro e a tela de assinatura não tem o que vender. */
  billing: boolean
  /** Quem nunca assinou ainda tem os 7 dias grátis. Só é falso depois da primeira assinatura. */
  trialAvailable: boolean
  /** Instante ISO do fim dos 7 dias grátis. Só existe enquanto a assinatura está em teste. */
  trialEndsAt: string | null
  /** Instante ISO do fim do período atual, no Pro com assinatura. */
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
export const PAYING = new Set(['active', 'trialing', 'past_due'])

export function limitsOf(tier: Tier): Limits {
  return tier === 'free' ? { maxHabits: FREE_MAX_HABITS, treinos: false } : { maxHabits: null, treinos: true }
}

export function resolvePlan(input: {
  billing: { enabled: boolean }
  subscription: Subscription | null
}): PlanInfo {
  const { billing, subscription } = input

  // Cobrança desligada: todo mundo tem tudo, e nada muda para ninguém.
  if (!billing.enabled) {
    return { tier: 'pro', billing: false, trialAvailable: false, trialEndsAt: null, periodEnd: null, cancelAtPeriodEnd: false }
  }

  const periodEnd = subscription?.currentPeriodEnd?.toISOString() ?? null
  if (subscription && PAYING.has(subscription.status)) {
    return {
      tier: 'pro',
      billing: true,
      trialAvailable: false,
      // Durante o teste, o fim do período da Stripe é o fim dos 7 dias.
      trialEndsAt: subscription.status === 'trialing' ? periodEnd : null,
      periodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    }
  }

  return {
    tier: 'free',
    billing: true,
    // Teste só na primeira vez: quem já teve assinatura, mesmo cancelada, não ganha outro.
    trialAvailable: subscription === null,
    trialEndsAt: null,
    periodEnd: null,
    cancelAtPeriodEnd: false,
  }
}

/**
 * A foto fica no aparelho e abre sem internet, então o plano que ela traz pode ter
 * vencido. Isto só rebaixa, e só para a tela: quem decide de verdade é o servidor.
 */
export function effectiveTier(plan: PlanInfo, now: Date): Tier {
  if (plan.tier === 'pro' && plan.cancelAtPeriodEnd && plan.periodEnd && now >= new Date(plan.periodEnd)) {
    return 'free'
  }
  return plan.tier
}
