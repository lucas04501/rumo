import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type Stripe from 'stripe'
import { baseURL } from '../auth.js'
import { billingConfig } from '../billing.js'
import { claim, db } from '../db/client.js'
import { subscriptions, user } from '../db/schema.js'
import { PAYING, TRIAL_DAYS } from '../plan.js'
import type { AuthedEnv } from '../session.js'
import { stripe } from '../stripe.js'

const ownSubscription = async (userId: string) => {
  const [, rows] = await db.batch([claim(userId), db.select().from(subscriptions).where(eq(subscriptions.userId, userId))])
  return rows[0]
}

/** Checkout e portal. Quem chama é a pessoa logada, e a assinatura é sempre a dela. */
export const billing = new Hono<AuthedEnv>()
  .post('/checkout', async (c) => {
    const userId = c.get('userId')
    const priceId = process.env.STRIPE_PRICE_ID
    if (!billingConfig().enabled || !priceId) throw new HTTPException(503, { message: 'billing_unavailable' })

    const row = await ownSubscription(userId)
    if (row && PAYING.has(row.status)) throw new HTTPException(409, { message: 'already_subscribed' })

    const [owner] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId))
    const base = baseURL ?? new URL(c.req.url).origin

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // Os 7 dias grátis só valem com o cartão informado, e a Stripe só cobra depois deles.
      payment_method_collection: 'always',
      client_reference_id: userId,
      // Quem já teve assinatura volta ao mesmo cliente e não ganha outro teste.
      ...(row ? { customer: row.stripeCustomerId } : { customer_email: owner?.email }),
      subscription_data: { metadata: { userId }, ...(row ? {} : { trial_period_days: TRIAL_DAYS }) },
      success_url: `${base}/assinatura?assinou=1`,
      cancel_url: `${base}/assinatura`,
      locale: 'pt-BR',
    })
    return c.json({ url: session.url })
  })
  .post('/portal', async (c) => {
    const row = await ownSubscription(c.get('userId'))
    // Conta de cortesia não tem cliente na Stripe.
    if (!row || row.stripeCustomerId.startsWith('cortesia_')) throw new HTTPException(404, { message: 'not_found' })

    const portal = await stripe().billingPortal.sessions.create({
      customer: row.stripeCustomerId,
      return_url: `${baseURL ?? new URL(c.req.url).origin}/assinatura`,
      locale: 'pt-BR',
    })
    return c.json({ url: portal.url })
  })

/**
 * Grava o estado da assinatura. Busca de novo na Stripe em vez de confiar no evento: eles
 * podem chegar fora de ordem, e assim a última leitura sempre vence.
 */
async function syncSubscription(subscriptionId: string) {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId)
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const userId =
    subscription.metadata.userId ??
    (await db.select({ id: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.stripeCustomerId, customerId)))[0]?.id
  if (!userId) return

  // Conta excluída entre o evento e agora: não há onde gravar.
  const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId))
  if (!owner) return

  // Duas abas pagando ao mesmo tempo: a assinatura que chegou depois é duplicata e é cancelada.
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))
  if (existing?.stripeSubscriptionId && existing.stripeSubscriptionId !== subscription.id && PAYING.has(existing.status)) {
    // O aviso da duplicata já cancelada também chega aqui, e não pode apagar a assinatura que vale.
    if (PAYING.has(subscription.status)) await stripe().subscriptions.cancel(subscription.id)
    return
  }

  // Durante o teste, o fim do período é o fim dos 7 dias.
  const periodEnd = subscription.items.data[0]?.current_period_end
  const values = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date(),
  }
  await db.insert(subscriptions).values({ userId, ...values }).onConflictDoUpdate({ target: subscriptions.userId, set: values })
}

/** Sem login: quem prova que é a Stripe é a assinatura do corpo, com o segredo do webhook. */
export const stripeWebhook = new Hono().post('/', async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = c.req.header('stripe-signature')
  if (!secret) throw new HTTPException(503, { message: 'billing_unavailable' })
  if (!signature) throw new HTTPException(400, { message: 'invalid_signature' })

  let event: Stripe.Event
  try {
    event = await stripe().webhooks.constructEventAsync(await c.req.text(), signature, secret)
  } catch {
    throw new HTTPException(400, { message: 'invalid_signature' })
  }

  if (event.type.startsWith('customer.subscription.')) {
    await syncSubscription((event.data.object as Stripe.Subscription).id)
  }
  return c.json({ received: true })
})
