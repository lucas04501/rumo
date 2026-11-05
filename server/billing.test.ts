import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// A Stripe é simulada: nenhum teste fala com ela, e a assinatura do webhook é verificada de verdade.
const stripeMock = vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'true'
  process.env.BILLING_ENABLED = 'true'
  process.env.STRIPE_PRICE_ID = 'price_teste'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_teste'
  return {
    subscription: {} as Record<string, unknown>,
    checkouts: [] as Record<string, unknown>[],
    portals: [] as Record<string, unknown>[],
    deleted: [] as string[],
    cancelled: [] as string[],
  }
})

vi.mock('./stripe.js', async () => {
  const { default: Stripe } = await import('stripe')
  const real = new Stripe('sk_test_falsa')
  return {
    stripe: () => ({
      webhooks: real.webhooks,
      subscriptions: {
        retrieve: async () => stripeMock.subscription,
        cancel: async (id: string) => {
          stripeMock.cancelled.push(id)
          return {}
        },
      },
      customers: {
        del: async (id: string) => {
          stripeMock.deleted.push(id)
          return {}
        },
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            stripeMock.checkouts.push(params)
            return { url: 'https://checkout.stripe.test/sessao' }
          },
        },
      },
      billingPortal: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            stripeMock.portals.push(params)
            return { url: 'https://portal.stripe.test/sessao' }
          },
        },
      },
    }),
  }
})

const { default: Stripe } = await import('stripe')
const { eq, inArray } = await import('drizzle-orm')
const { app } = await import('./app.js')
const { db } = await import('./db/client.js')
const { subscriptions, user } = await import('./db/schema.js')

const stamp = Date.now()
const password = randomBytes(18).toString('base64url')
const emails = { eva: `eva-${stamp}@rumo.test`, gil: `gil-${stamp}@rumo.test` }
const headers = { 'content-type': 'application/json', origin: 'http://localhost:8787' }

type Person = { cookie: string; id: string }

async function signUp(name: string, email: string): Promise<Person> {
  const response = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email, password }),
  })
  expect(response.status).toBe(200)
  const body = (await response.json()) as { user: { id: string } }
  const cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  return { cookie, id: body.user.id }
}

const post = (person: Person | null, path: string) =>
  app.request(`/api${path}`, { method: 'POST', headers: { ...headers, ...(person && { cookie: person.cookie }) } })

const signer = new Stripe('sk_test_falsa').webhooks
const webhook = (event: object, signature?: string) => {
  const payload = JSON.stringify(event)
  return app.request('/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': signature ?? signer.generateTestHeaderString({ payload, secret: 'whsec_teste' }) },
    body: payload,
  })
}

/** O que a Stripe devolve para a assinatura do `person`. `periodEnd` está em segundos. */
const stripeSubscription = (person: Person, status: string, extra: object = {}) => {
  stripeMock.subscription = {
    id: `sub_${person.id}`,
    customer: `cus_${person.id}`,
    status,
    cancel_at_period_end: false,
    metadata: { userId: person.id },
    items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 7 * 86_400 }] },
    ...extra,
  }
  return { type: 'customer.subscription.updated', data: { object: { id: `sub_${person.id}` } } }
}

const planOf = async (person: Person) => {
  const response = await app.request('/api/snapshot', { headers: { cookie: person.cookie } })
  return ((await response.json()) as { plan: Record<string, unknown> }).plan
}

let eva: Person
let gil: Person

beforeAll(async () => {
  eva = await signUp('Eva', emails.eva)
  gil = await signUp('Gil', emails.gil)
})

afterAll(async () => {
  delete process.env.BILLING_ENABLED
  await db.delete(user).where(inArray(user.email, Object.values(emails)))
})

describe('cobrança', () => {
  it('checkout e portal exigem login', async () => {
    expect((await post(null, '/billing/checkout')).status).toBe(401)
    expect((await post(null, '/billing/portal')).status).toBe(401)
  })

  it('o webhook recusa corpo sem assinatura ou com assinatura falsa, sem gravar nada', async () => {
    const event = stripeSubscription(eva, 'active')
    const payload = JSON.stringify(event)
    const unsigned = await app.request('/api/stripe/webhook', { method: 'POST', body: payload })
    expect(unsigned.status).toBe(400)
    expect((await webhook(event, 't=1,v1=abc')).status).toBe(400)
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, eva.id))).toHaveLength(0)
  })

  it('a primeira assinatura pede o cartão e dá 7 dias grátis, cobrando só depois', async () => {
    const response = await post(eva, '/billing/checkout')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: 'https://checkout.stripe.test/sessao' })

    const params = stripeMock.checkouts.at(-1)!
    expect(params).toMatchObject({
      mode: 'subscription',
      payment_method_collection: 'always',
      customer_email: emails.eva,
      client_reference_id: eva.id,
      subscription_data: { trial_period_days: 7, metadata: { userId: eva.id } },
    })
    expect(params).not.toHaveProperty('customer')
  })

  it('com a assinatura em teste, a pessoa vira Pro e o fim do teste aparece', async () => {
    expect((await webhook(stripeSubscription(eva, 'trialing'))).status).toBe(200)

    const plan = await planOf(eva)
    expect(plan).toMatchObject({ tier: 'pro', trialAvailable: false })
    expect(plan.trialEndsAt).not.toBeNull()
    // Quem já assina não abre outro checkout.
    expect((await post(eva, '/billing/checkout')).status).toBe(409)
  })

  it('o mesmo aviso chegando de novo não duplica nem mexe em outra pessoa', async () => {
    await webhook(stripeSubscription(eva, 'active'))
    await webhook(stripeSubscription(eva, 'active'))

    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, eva.id))).toHaveLength(1)
    expect(await planOf(eva)).toMatchObject({ tier: 'pro', trialEndsAt: null })
    expect(await planOf(gil)).toMatchObject({ tier: 'free', trialAvailable: true })
  })

  it('o portal abre só o cliente da própria pessoa', async () => {
    expect((await post(gil, '/billing/portal')).status).toBe(404)

    const response = await post(eva, '/billing/portal')
    expect(response.status).toBe(200)
    expect(stripeMock.portals.at(-1)).toMatchObject({ customer: `cus_${eva.id}` })
  })

  it('assinatura cancelada volta ao grátis, e o novo checkout não dá outro teste', async () => {
    await webhook(stripeSubscription(eva, 'canceled'))
    expect(await planOf(eva)).toMatchObject({ tier: 'free', trialAvailable: false })

    expect((await post(eva, '/billing/checkout')).status).toBe(200)
    const params = stripeMock.checkouts.at(-1)!
    expect(params).toMatchObject({ customer: `cus_${eva.id}` })
    expect(params).not.toHaveProperty('customer_email')
    expect(params.subscription_data).not.toHaveProperty('trial_period_days')
  })

  it('aviso de assinatura sem dono ou de conta que não existe mais é aceito sem gravar', async () => {
    const orphan = { id: 'sub_orfa', customer: 'cus_orfa', status: 'active', cancel_at_period_end: false, metadata: {}, items: { data: [] } }
    stripeMock.subscription = orphan
    expect((await webhook({ type: 'customer.subscription.created', data: { object: { id: 'sub_orfa' } } })).status).toBe(200)

    stripeMock.subscription = { ...orphan, metadata: { userId: 'quem-nao-existe' } }
    expect((await webhook({ type: 'customer.subscription.created', data: { object: { id: 'sub_orfa' } } })).status).toBe(200)

    expect(await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, 'cus_orfa'))).toHaveLength(0)
  })

  it('conta de cortesia é Pro sem Stripe: não abre portal nem outro checkout', async () => {
    await db.insert(subscriptions).values({ userId: gil.id, stripeCustomerId: `cortesia_${gil.id}`, status: 'active' })
    const portals = stripeMock.portals.length
    const checkouts = stripeMock.checkouts.length

    expect(await planOf(gil)).toMatchObject({ tier: 'pro', trialEndsAt: null, periodEnd: null })
    expect((await post(gil, '/billing/portal')).status).toBe(404)
    expect((await post(gil, '/billing/checkout')).status).toBe(409)
    expect(stripeMock.portals).toHaveLength(portals)
    expect(stripeMock.checkouts).toHaveLength(checkouts)

    await db.delete(subscriptions).where(eq(subscriptions.userId, gil.id))
  })

  it('segunda assinatura paga ao mesmo tempo é cancelada e não mexe na linha', async () => {
    await webhook(stripeSubscription(gil, 'active'))
    const rowOf = async () => (await db.select().from(subscriptions).where(eq(subscriptions.userId, gil.id)))[0]
    expect((await rowOf()).stripeSubscriptionId).toBe(`sub_${gil.id}`)

    await webhook(stripeSubscription(gil, 'trialing', { id: 'sub_duplicada', customer: 'cus_duplicado' }))
    expect(stripeMock.cancelled).toEqual(['sub_duplicada'])
    expect(await rowOf()).toMatchObject({ stripeSubscriptionId: `sub_${gil.id}`, stripeCustomerId: `cus_${gil.id}`, status: 'active' })

    // O aviso de que a duplicata foi cancelada também chega, e não pode apagar a assinatura que vale.
    await webhook(stripeSubscription(gil, 'canceled', { id: 'sub_duplicada', customer: 'cus_duplicado' }))
    expect(stripeMock.cancelled).toEqual(['sub_duplicada'])
    expect(await rowOf()).toMatchObject({ stripeSubscriptionId: `sub_${gil.id}`, status: 'active' })
    expect(await planOf(gil)).toMatchObject({ tier: 'pro' })

    // A mesma assinatura chegando de novo é normal: nada é cancelado.
    await webhook(stripeSubscription(gil, 'active'))
    expect(stripeMock.cancelled).toEqual(['sub_duplicada'])
  })

  it('com a assinatura cancelada, uma nova substitui a linha', async () => {
    await webhook(stripeSubscription(gil, 'canceled'))
    await webhook(stripeSubscription(gil, 'active', { id: 'sub_nova' }))

    expect(stripeMock.cancelled).toEqual(['sub_duplicada'])
    expect((await db.select().from(subscriptions).where(eq(subscriptions.userId, gil.id)))[0]).toMatchObject({
      stripeSubscriptionId: 'sub_nova',
      status: 'active',
    })
  })

  it('excluir a conta apaga o cliente na Stripe, que cancela a assinatura', async () => {
    const response = await app.request('/api/auth/delete-user', {
      method: 'POST',
      headers: { ...headers, cookie: eva.cookie },
      body: JSON.stringify({ password }),
    })
    expect(response.status).toBe(200)
    expect(stripeMock.deleted).toEqual([`cus_${eva.id}`])
    expect(await db.select().from(subscriptions).where(eq(subscriptions.userId, eva.id))).toHaveLength(0)
  })
})
