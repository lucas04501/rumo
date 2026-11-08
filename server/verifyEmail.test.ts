import { randomBytes } from 'node:crypto'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'true'
  process.env.REQUIRE_EMAIL_VERIFICATION = 'true'
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

const email = `confirma-${Date.now()}@rumo.test`
const password = randomBytes(18).toString('base64url')
const headers = { 'content-type': 'application/json', origin: 'http://localhost:8787' }

const post = (path: string, body: unknown) =>
  app.request(`/api/auth${path}`, { method: 'POST', headers, body: JSON.stringify(body) })

const hasSession = (response: Response) => response.headers.getSetCookie().some((value) => value.includes('session_token='))

beforeEach(() => {
  sent.length = 0
})

afterAll(async () => {
  await db.delete(schema.user).where(eq(schema.user.email, email))
})

describe('confirmação de e-mail ligada', () => {
  it('informa que a confirmação é exigida', async () => {
    const response = await app.request('/api/signup-status')
    expect(await response.json()).toEqual({ open: true, verify: true })
  })

  it('cadastra sem abrir sessão e manda o link', async () => {
    const response = await post('/sign-up/email', { name: 'Confirma', email, password })
    expect(response.status).toBe(200)
    expect(hasSession(response)).toBe(false)
    expect(sent).toHaveLength(1)
    expect(sent[0].to).toBe(email)
  })

  it('recusa entrar antes de confirmar e reenvia o link', async () => {
    const response = await post('/sign-in/email', { email, password })
    expect(response.status).toBe(403)
    expect(hasSession(response)).toBe(false)
    expect(sent).toHaveLength(1)
  })

  it('recusa um token inventado', async () => {
    const response = await app.request('/api/auth/verify-email?token=inventado&callbackURL=%2F')
    expect(hasSession(response)).toBe(false)
    const [row] = await db.select().from(schema.user).where(eq(schema.user.email, email))
    expect(row.emailVerified).toBe(false)
  })

  it('o link confirma a conta e abre a sessão', async () => {
    await post('/sign-in/email', { email, password })
    const link = new URL(sent.at(-1)!.text.match(/https?:\/\/\S+/)![0])
    const response = await app.request(link.pathname + link.search)
    expect(hasSession(response)).toBe(true)
    const [row] = await db.select().from(schema.user).where(eq(schema.user.email, email))
    expect(row.emailVerified).toBe(true)
  })

  it('depois de confirmada, a conta entra normalmente', async () => {
    const response = await post('/sign-in/email', { email, password })
    expect(response.status).toBe(200)
    expect(hasSession(response)).toBe(true)
  })
})
