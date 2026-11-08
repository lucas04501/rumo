import { randomBytes } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'false'
})

const { app } = await import('./app.js')

describe('cadastro fechado', () => {
  it('informa que o cadastro está fechado', async () => {
    const response = await app.request('/api/signup-status')
    expect(await response.json()).toEqual({ open: false, verify: false })
  })

  it('recusa criar conta', async () => {
    const response = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:8787' },
      body: JSON.stringify({
        name: 'Intruso',
        email: `intruso-${Date.now()}@rumo.test`,
        password: randomBytes(18).toString('base64url'),
      }),
    })
    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(response.status).toBeLessThan(500)
  })
})
