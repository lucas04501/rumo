import { randomBytes } from 'node:crypto'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  // O limite só liga em produção. A API continua apontando para a branch `dev`.
  process.env.NODE_ENV = 'production'
})

const { like } = await import('drizzle-orm')
const { app } = await import('./app.js')
const { db } = await import('./db/client.js')
const { rateLimit } = await import('./db/schema.js')

const MAX_ATTEMPTS = 8
const stamp = randomBytes(2).readUInt16BE()
const ip = (host: number) => `10.${stamp >> 8}.${stamp & 255}.${host}`

function signIn(address: string) {
  return app.request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:8787',
      'x-forwarded-for': address,
    },
    body: JSON.stringify({ email: `ninguem-${stamp}@rumo.test`, password: 'senha-errada' }),
  })
}

afterAll(async () => {
  await db.delete(rateLimit).where(like(rateLimit.key, `%10.${stamp >> 8}.${stamp & 255}.%`))
})

describe('limite de tentativas de login', () => {
  it('bloqueia depois do limite e guarda a contagem no banco', async () => {
    const statuses = []
    for (let attempt = 0; attempt < MAX_ATTEMPTS + 1; attempt += 1) {
      statuses.push((await signIn(ip(1))).status)
    }

    expect(statuses.slice(0, MAX_ATTEMPTS).every((status) => status === 401)).toBe(true)
    expect(statuses[MAX_ATTEMPTS]).toBe(429)

    const rows = await db.select().from(rateLimit).where(like(rateLimit.key, `%${ip(1)}%`))
    expect(rows).toHaveLength(1)
    expect(rows[0].count).toBe(MAX_ATTEMPTS)
  })

  it('o bloqueio de um endereço não atinge outro', async () => {
    expect((await signIn(ip(2))).status).toBe(401)
  })
})
