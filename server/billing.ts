import { eq } from 'drizzle-orm'
import { claim, db } from './db/client.js'
import { subscriptions } from './db/schema.js'
import { resolvePlan, type PlanInfo, type Subscription } from './plan.js'

/**
 * Lida a cada chamada, não ao carregar o módulo: os testes ligam e desligam.
 * `BILLING_ENABLED` desligado deixa todo mundo com tudo.
 */
export function billingConfig() {
  return { enabled: process.env.BILLING_ENABLED === 'true' }
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
export function planFrom(row: SubscriptionRow | undefined): PlanInfo {
  return resolvePlan({ billing: billingConfig(), subscription: toSubscription(row) })
}

/** Para as rotas que só precisam decidir um limite. Com a cobrança desligada, nem consulta o banco. */
export async function loadPlan(userId: string): Promise<PlanInfo> {
  if (!billingConfig().enabled) return planFrom(undefined)

  const [, rows] = await db.batch([
    claim(userId),
    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
  ])
  return planFrom(rows[0])
}
