import { eq } from 'drizzle-orm'
import { claim, db } from './db/client.js'
import { subscriptions, user } from './db/schema.js'
import { resolvePlan, type PlanInfo, type Subscription } from './plan.js'

/**
 * Lida a cada chamada, não ao carregar o módulo: os testes ligam e desligam.
 * `BILLING_ENABLED` desligado deixa todo mundo com tudo. `BILLING_STARTS_AT` é o dia em
 * que a cobrança liga: o teste de quem já tinha conta conta a partir dele.
 */
export function billingConfig() {
  const enabled = process.env.BILLING_ENABLED === 'true'
  const startsAt = new Date(process.env.BILLING_STARTS_AT ?? 0)
  if (enabled && Number.isNaN(startsAt.getTime())) throw new Error('BILLING_STARTS_AT inválida')
  return { enabled, startsAt }
}

type SubscriptionRow = typeof subscriptions.$inferSelect

export function toSubscription(row: SubscriptionRow | undefined): Subscription | null {
  if (!row) return null
  return {
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  }
}

/** Montagem a partir do que a rota já leu. A foto usa esta, no mesmo lote das outras consultas. */
export function planFrom(createdAt: Date, row: SubscriptionRow | undefined, now = new Date()): PlanInfo {
  return resolvePlan({ billing: billingConfig(), createdAt, subscription: toSubscription(row), now })
}

/** Para as rotas que só precisam decidir um limite. Com a cobrança desligada, nem consulta o banco. */
export async function loadPlan(userId: string, now = new Date()): Promise<PlanInfo> {
  if (!billingConfig().enabled) return planFrom(now, undefined, now)

  // `user` é do Better Auth e fica fora da RLS. A assinatura passa pelo `claim`.
  const [owner] = await db.select({ createdAt: user.createdAt }).from(user).where(eq(user.id, userId))
  const [, rows] = await db.batch([
    claim(userId),
    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
  ])
  return planFrom(owner?.createdAt ?? now, rows[0], now)
}
