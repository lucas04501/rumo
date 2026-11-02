import { randomBytes, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'true'
})

const { inArray } = await import('drizzle-orm')
const { app } = await import('./app.js')
const { db } = await import('./db/client.js')
const { goals, user } = await import('./db/schema.js')

const stamp = Date.now()
const password = randomBytes(18).toString('base64url')
const emails = { ana: `ana-${stamp}@rumo.test`, bia: `bia-${stamp}@rumo.test` }

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

function call(person: Person | null, method: string, path: string, body?: unknown) {
  return app.request(`/api${path}`, {
    method,
    headers: {
      ...(person && { cookie: person.cookie }),
      ...(body !== undefined && { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const DATE = '2026-11-02'
const RANGE = `from=${DATE}&to=${DATE}`

let ana: Person
let bia: Person
const goalId = randomUUID()
const milestoneId = randomUUID()
const habitId = randomUUID()
const taskId = randomUUID()
const noteId = randomUUID()

const habitBody = { title: 'Treinar', icon: 'dumbbell', weekdays: [1, 3, 5], startDate: DATE }

beforeAll(async () => {
  ana = await signUp('Ana', emails.ana)
  bia = await signUp('Bia', emails.bia)

  const writes = await Promise.all([
    call(ana, 'PUT', `/goals/${goalId}`, { title: 'Meta da Ana' }),
    call(ana, 'PUT', `/tasks/${taskId}`, { title: 'Tarefa da Ana', date: DATE }),
    call(ana, 'PUT', `/notes/${noteId}`, { title: 'Nota da Ana' }),
  ])
  expect(writes.map((response) => response.status)).toEqual([200, 200, 200])

  const dependents = await Promise.all([
    call(ana, 'PUT', `/milestones/${milestoneId}`, { title: 'Marco da Ana', goalId }),
    call(ana, 'PUT', `/habits/${habitId}`, { ...habitBody, goalId }),
  ])
  expect(dependents.map((response) => response.status)).toEqual([200, 200])

  expect((await call(ana, 'PUT', `/checks/${habitId}/${DATE}`)).status).toBe(204)
  expect((await call(ana, 'PUT', `/days/${DATE}`, { note: 'Diário da Ana' })).status).toBe(200)
})

afterAll(async () => {
  await db.delete(user).where(inArray(user.email, [emails.ana, emails.bia]))
})

const resources = [
  ['goals', () => goalId, { title: 'Invadido' }],
  ['tasks', () => taskId, { title: 'Invadido', date: DATE }],
  ['notes', () => noteId, { title: 'Invadido' }],
  ['habits', () => habitId, { ...habitBody, title: 'Invadido' }],
  ['milestones', () => milestoneId, { title: 'Invadido', goalId: randomUUID() }],
] as const

describe('sem sessão', () => {
  it.each([
    ['GET', '/goals'],
    ['PUT', `/goals/${randomUUID()}`],
    ['DELETE', `/goals/${randomUUID()}`],
    ['GET', '/habits'],
    ['GET', '/milestones'],
    ['GET', '/tasks'],
    ['GET', '/notes'],
    ['GET', `/checks?${RANGE}`],
    ['GET', `/days?${RANGE}`],
    ['PUT', `/days/${DATE}`],
  ])('%s %s é recusado', async (method, path) => {
    expect((await call(null, method, path)).status).toBe(401)
  })
})

describe('isolamento entre usuários', () => {
  it.each(resources)('%s: um usuário não lista dados do outro', async (name) => {
    const ofAna = (await (await call(ana, 'GET', `/${name}`)).json()) as unknown[]
    const ofBia = (await (await call(bia, 'GET', `/${name}`)).json()) as unknown[]
    expect(ofAna).toHaveLength(1)
    expect(ofBia).toHaveLength(0)
  })

  it.each(resources)('%s: não sobrescreve item de outro usuário', async (name, id, body) => {
    expect((await call(bia, 'PUT', `/${name}/${id()}`, body)).status).toBe(404)
    const [row] = (await (await call(ana, 'GET', `/${name}`)).json()) as { title: string }[]
    expect(row.title).not.toBe('Invadido')
  })

  it.each(resources)('%s: não exclui item de outro usuário', async (name, id) => {
    expect((await call(bia, 'DELETE', `/${name}/${id()}`)).status).toBe(404)
    const rows = (await (await call(ana, 'GET', `/${name}`)).json()) as unknown[]
    expect(rows).toHaveLength(1)
  })

  it('milestones: não sobrescreve marco de outro usuário usando meta própria', async () => {
    const own = randomUUID()
    await call(bia, 'PUT', `/goals/${own}`, { title: 'Meta da Bia' })

    const response = await call(bia, 'PUT', `/milestones/${milestoneId}`, { title: 'Invadido', goalId: own })
    expect(response.status).toBe(404)

    const [row] = (await (await call(ana, 'GET', '/milestones')).json()) as { title: string }[]
    expect(row.title).toBe('Marco da Ana')
  })

  it('não vincula marco à meta de outro usuário', async () => {
    const response = await call(bia, 'PUT', `/milestones/${randomUUID()}`, { title: 'X', goalId })
    expect(response.status).toBe(404)
  })

  it('não vincula hábito nem nota à meta de outro usuário', async () => {
    const habit = await call(bia, 'PUT', `/habits/${randomUUID()}`, { ...habitBody, goalId })
    const note = await call(bia, 'PUT', `/notes/${randomUUID()}`, { title: 'X', goalId })
    expect(habit.status).toBe(404)
    expect(note.status).toBe(404)
  })

  it('não marca nem desmarca check em hábito de outro usuário', async () => {
    expect((await call(bia, 'PUT', `/checks/${habitId}/2026-11-03`)).status).toBe(404)
    await call(bia, 'DELETE', `/checks/${habitId}/${DATE}`)

    const ofAna = (await (await call(ana, 'GET', `/checks?${RANGE}`)).json()) as unknown[]
    const ofBia = (await (await call(bia, 'GET', `/checks?${RANGE}`)).json()) as unknown[]
    expect(ofAna).toHaveLength(1)
    expect(ofBia).toHaveLength(0)
  })

  it('o mesmo dia é separado por usuário', async () => {
    await call(bia, 'PUT', `/days/${DATE}`, { note: 'Diário da Bia' })
    const ofAna = (await (await call(ana, 'GET', `/days?${RANGE}`)).json()) as { note: string }[]
    const ofBia = (await (await call(bia, 'GET', `/days?${RANGE}`)).json()) as { note: string }[]
    expect(ofAna[0].note).toBe('Diário da Ana')
    expect(ofBia[0].note).toBe('Diário da Bia')
  })

  it('ignora um user_id enviado no corpo', async () => {
    const id = randomUUID()
    await call(bia, 'PUT', `/goals/${id}`, { title: 'Da Bia', userId: ana.id })
    const [row] = await db.select().from(goals).where(inArray(goals.id, [id]))
    expect(row.userId).toBe(bia.id)
  })
})

describe('escritas idempotentes', () => {
  it('repetir o mesmo PUT não duplica', async () => {
    const id = randomUUID()
    await call(bia, 'PUT', `/tasks/${id}`, { title: 'Repetida', date: DATE })
    await call(bia, 'PUT', `/tasks/${id}`, { title: 'Repetida', date: DATE })
    const rows = (await (await call(bia, 'GET', '/tasks')).json()) as { id: string }[]
    expect(rows.filter((row) => row.id === id)).toHaveLength(1)
  })

  it('repetir o check não duplica', async () => {
    const id = randomUUID()
    await call(bia, 'PUT', `/habits/${id}`, habitBody)
    await call(bia, 'PUT', `/checks/${id}/${DATE}`)
    expect((await call(bia, 'PUT', `/checks/${id}/${DATE}`)).status).toBe(204)
    const rows = (await (await call(bia, 'GET', `/checks?${RANGE}`)).json()) as unknown[]
    expect(rows).toHaveLength(1)
  })
})

describe('sincronização', () => {
  it('um item excluído não volta pela fila offline', async () => {
    const id = randomUUID()
    await call(bia, 'PUT', `/tasks/${id}`, { title: 'Excluir', date: DATE })
    expect((await call(bia, 'DELETE', `/tasks/${id}`)).status).toBe(204)
    expect((await call(bia, 'PUT', `/tasks/${id}`, { title: 'Voltou', date: DATE })).status).toBe(404)
    const rows = (await (await call(bia, 'GET', '/tasks')).json()) as { id: string }[]
    expect(rows.some((row) => row.id === id)).toBe(false)
  })

  it('vence a edição mais recente, mesmo chegando antes', async () => {
    const id = randomUUID()
    const newer = new Date(Date.now() - 1_000).toISOString()
    const older = new Date(Date.now() - 60_000).toISOString()

    await call(bia, 'PUT', `/notes/${id}`, { title: 'Nova', editedAt: newer })
    expect((await call(bia, 'PUT', `/notes/${id}`, { title: 'Antiga', editedAt: older })).status).toBe(404)

    const rows = (await (await call(bia, 'GET', '/notes')).json()) as { id: string; title: string }[]
    expect(rows.find((row) => row.id === id)?.title).toBe('Nova')
  })
})

describe('validação', () => {
  it('recusa data inválida', async () => {
    expect((await call(bia, 'PUT', `/days/2026-02-30`, {})).status).toBe(400)
  })

  it('recusa ID que não é UUID', async () => {
    expect((await call(bia, 'PUT', '/goals/1', { title: 'X' })).status).toBe(400)
  })

  it('recusa título vazio', async () => {
    expect((await call(bia, 'PUT', `/goals/${randomUUID()}`, { title: '   ' })).status).toBe(400)
  })
})
