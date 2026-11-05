import { randomBytes, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'true'
})

const { eq, inArray } = await import('drizzle-orm')
const { app } = await import('./app.js')
const { db } = await import('./db/client.js')
const { subscriptions, user } = await import('./db/schema.js')

const stamp = Date.now()
const password = randomBytes(18).toString('base64url')
const emails = { cris: `cris-${stamp}@rumo.test`, davi: `davi-${stamp}@rumo.test` }
const DATE = '2026-11-02'
const habitBody = { title: 'Ler', icon: 'book', weekdays: [1, 3, 5], startDate: DATE }

type Person = { cookie: string; id: string }

async function signUp(name: string, email: string): Promise<Person> {
  const response = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:8787' },
    body: JSON.stringify({ name, email, password }),
  })
  expect(response.status).toBe(200)
  const body = (await response.json()) as { user: { id: string } }
  const cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  return { cookie, id: body.user.id }
}

function call(person: Person, method: string, path: string, body?: unknown) {
  return app.request(`/api${path}`, {
    method,
    headers: { cookie: person.cookie, ...(body !== undefined && { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const addHabit = (person: Person, extra: object = {}) =>
  call(person, 'PUT', `/habits/${randomUUID()}`, { ...habitBody, ...extra })

const planOf = async (person: Person) =>
  ((await (await call(person, 'GET', '/snapshot')).json()) as { plan: { tier: string; trialEndsAt: string | null } }).plan

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000)

let cris: Person
let davi: Person

beforeAll(async () => {
  cris = await signUp('Cris', emails.cris)
  davi = await signUp('Davi', emails.davi)
})

afterAll(async () => {
  delete process.env.BILLING_ENABLED
  await db.delete(user).where(inArray(user.email, Object.values(emails)))
})

describe('plano grátis', () => {
  it('com a cobrança desligada, todo mundo tem tudo', async () => {
    delete process.env.BILLING_ENABLED
    await db.update(user).set({ createdAt: daysAgo(30) }).where(eq(user.id, cris.id))

    for (let i = 0; i < 5; i++) expect((await addHabit(cris)).status).toBe(200)
    expect((await planOf(cris)).tier).toBe('pro')
  })

  it('no teste não há limite', async () => {
    process.env.BILLING_ENABLED = 'true'
    await db.update(user).set({ createdAt: new Date() }).where(eq(user.id, davi.id))

    for (let i = 0; i < 4; i++) expect((await addHabit(davi)).status).toBe(200)
    const plan = await planOf(davi)
    expect(plan.tier).toBe('trial')
    expect(plan.trialEndsAt).not.toBeNull()
    expect((await call(davi, 'PUT', `/workout-plans/${randomUUID()}`, { title: 'Ficha', weekdays: [1] })).status).toBe(200)
  })

  it('no grátis o servidor recusa o hábito novo, mas deixa editar os que já existem', async () => {
    process.env.BILLING_ENABLED = 'true'
    expect((await planOf(cris)).tier).toBe('free')

    // Cris já tem 5 ativos, vindos de antes da cobrança: nada some e editar continua livre.
    const snapshot = (await (await call(cris, 'GET', '/snapshot')).json()) as { habits: { id: string }[] }
    expect(snapshot.habits).toHaveLength(5)
    const [first, second] = snapshot.habits
    expect((await call(cris, 'PUT', `/habits/${first!.id}`, { ...habitBody, title: 'Ler mais' })).status).toBe(200)

    expect((await addHabit(cris)).status).toBe(402)
    expect(await (await addHabit(cris)).json()).toEqual({ error: 'plan_required' })

    // Arquivar é sempre permitido, mas desarquivar acima do limite é recusado: não é brecha.
    const archivedAt = new Date().toISOString()
    expect((await call(cris, 'PUT', `/habits/${second!.id}`, { ...habitBody, archivedAt })).status).toBe(200)
    expect((await call(cris, 'PUT', `/habits/${second!.id}`, { ...habitBody, archivedAt: null })).status).toBe(402)

    // Excluir três libera vaga: sobra 1 ativo (e 1 arquivado). Cabem mais dois, e o seguinte não.
    for (const { id } of snapshot.habits.slice(2)) {
      expect((await call(cris, 'DELETE', `/habits/${id}`)).status).toBe(204)
    }
    expect((await addHabit(cris)).status).toBe(200)
    expect((await addHabit(cris)).status).toBe(200)
    expect((await addHabit(cris)).status).toBe(402)
  })

  it('no grátis, Treinos fica em leitura, mas excluir continua liberado', async () => {
    process.env.BILLING_ENABLED = 'true'
    const planId = randomUUID()
    // Davi ainda está no teste e cria a ficha; depois o teste acaba.
    await db.update(user).set({ createdAt: new Date() }).where(eq(user.id, davi.id))
    expect((await call(davi, 'PUT', `/workout-plans/${planId}`, { title: 'Ficha', weekdays: [1] })).status).toBe(200)
    await db.update(user).set({ createdAt: daysAgo(30) }).where(eq(user.id, davi.id))

    expect((await planOf(davi)).tier).toBe('free')
    expect((await call(davi, 'PUT', `/workout-plans/${planId}`, { title: 'Outra', weekdays: [1] })).status).toBe(402)
    expect((await call(davi, 'PUT', `/custom-exercises/${randomUUID()}`, { name: 'X', muscle: 'Peito' })).status).toBe(402)
    expect((await call(davi, 'GET', '/workout-plans')).status).toBe(200)
    expect((await call(davi, 'DELETE', `/workout-plans/${planId}`)).status).toBe(204)
  })

  it('assinatura ativa libera tudo e é só da própria pessoa', async () => {
    process.env.BILLING_ENABLED = 'true'
    await db.insert(subscriptions).values({
      userId: cris.id,
      stripeCustomerId: `cus_teste_${stamp}`,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 20 * 86_400_000),
    })

    expect((await planOf(cris)).tier).toBe('pro')
    expect((await addHabit(cris)).status).toBe(200)
    // O Pro da Cris não vale para o Davi, que tem 4 hábitos ativos e já passou do limite.
    expect((await planOf(davi)).tier).toBe('free')
    expect((await addHabit(davi)).status).toBe(402)
  })
})
