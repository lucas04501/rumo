import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'true'
})

const sent = vi.hoisted(() => [] as { to: string; text: string }[])
vi.mock('./email.js', () => ({
  sendEmail: async (to: string, _subject: string, text: string) => {
    sent.push({ to, text })
  },
}))

const { eq } = await import('drizzle-orm')
const { app } = await import('./app.js')
const { db } = await import('./db/client.js')
const schema = await import('./db/schema.js')

const stamp = Date.now()
const email = `senha-${stamp}@rumo.test`
const oldPassword = randomBytes(18).toString('base64url')
const newPassword = randomBytes(18).toString('base64url')
const headers = { 'content-type': 'application/json', origin: 'http://localhost:8787' }

const post = (path: string, body: unknown, cookie?: string) =>
  app.request(`/api/auth${path}`, {
    method: 'POST',
    headers: { ...headers, ...(cookie && { cookie }) },
    body: JSON.stringify(body),
  })

const requestReset = (address: string) => post('/request-password-reset', { email: address, redirectTo: '/redefinir' })
const signIn = (password: string) => post('/sign-in/email', { email, password })

/** O link do e-mail leva à API, que redireciona para /redefinir com o token. */
async function tokenFromEmail() {
  const link = new URL(sent.at(-1)!.text.match(/https?:\/\/\S+/)![0])
  const response = await app.request(link.pathname + link.search)
  expect(response.status).toBe(302)
  const target = new URL(response.headers.get('location')!, 'http://localhost')
  expect(target.pathname).toBe('/redefinir')
  return target.searchParams.get('token')!
}

let cookie: string
let userId: string

beforeAll(async () => {
  const response = await post('/sign-up/email', { name: 'Senha', email, password: oldPassword })
  userId = ((await response.json()) as { user: { id: string } }).user.id
  cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
})

beforeEach(() => {
  sent.length = 0
})

afterAll(async () => {
  await db.delete(schema.user).where(eq(schema.user.email, email))
  await db.delete(schema.verification).where(eq(schema.verification.value, userId))
})

describe('recuperar senha', () => {
  it('responde igual para e-mail com e sem conta, e só envia para quem tem conta', async () => {
    const known = await requestReset(email)
    const unknown = await requestReset(`ninguem-${stamp}@rumo.test`)
    expect(known.status).toBe(200)
    expect(unknown.status).toBe(200)
    expect(await known.json()).toEqual(await unknown.json())
    expect(sent.map((message) => message.to)).toEqual([email])
  })

  it('token inventado não troca a senha', async () => {
    const response = await post('/reset-password', { token: 'inventado', newPassword })
    expect(response.status).toBe(400)
  })

  it('link vencido não troca a senha', async () => {
    await requestReset(email)
    const token = await tokenFromEmail()
    await db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.verification.identifier, `reset-password:${token}`))
    expect((await post('/reset-password', { token, newPassword })).status).toBe(400)
    expect((await signIn(oldPassword)).status).toBe(200)
  })

  it('troca a senha uma vez, encerra as sessões e a senha antiga para de valer', async () => {
    await requestReset(email)
    const token = await tokenFromEmail()

    expect((await post('/reset-password', { token, newPassword })).status).toBe(200)
    expect((await post('/reset-password', { token, newPassword: oldPassword })).status).toBe(400)

    expect((await signIn(oldPassword)).status).toBe(401)
    expect((await signIn(newPassword)).status).toBe(200)

    const session = await app.request('/api/auth/get-session', { headers: { cookie } })
    expect(await session.json()).toBeNull()
  })
})
