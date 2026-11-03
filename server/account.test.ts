import { randomBytes, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'true'
})

const { eq, inArray } = await import('drizzle-orm')
const { app } = await import('./app.js')
const { db } = await import('./db/client.js')
const schema = await import('./db/schema.js')

const stamp = Date.now()
const password = randomBytes(18).toString('base64url')
const emails = { ana: `conta-ana-${stamp}@rumo.test`, bia: `conta-bia-${stamp}@rumo.test` }
const headers = { 'content-type': 'application/json', origin: 'http://localhost:8787' }
const DATE = '2026-11-02'

type Person = { cookie: string; id: string }

async function signUp(name: string, email: string): Promise<Person> {
  const response = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email, password }),
  })
  const body = (await response.json()) as { user: { id: string } }
  const cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  return { cookie, id: body.user.id }
}

const put = (person: Person, path: string, body?: unknown) =>
  app.request(`/api${path}`, {
    method: 'PUT',
    headers: { cookie: person.cookie, ...(body !== undefined && { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const deleteUser = (person: Person, secret: string) =>
  app.request('/api/auth/delete-user', {
    method: 'POST',
    headers: { ...headers, cookie: person.cookie },
    body: JSON.stringify({ password: secret }),
  })

let ana: Person
let bia: Person

beforeAll(async () => {
  ana = await signUp('Ana', emails.ana)
  bia = await signUp('Bia', emails.bia)
})

afterAll(async () => {
  await db.delete(schema.user).where(inArray(schema.user.email, [emails.ana, emails.bia]))
})

describe('excluir conta', () => {
  it('senha errada não exclui nada', async () => {
    expect((await deleteUser(ana, 'senha-errada')).status).toBe(400)
    const [row] = await db.select().from(schema.user).where(eq(schema.user.id, ana.id))
    expect(row).toBeDefined()
  })

  it('sem sessão não exclui', async () => {
    const response = await app.request('/api/auth/delete-user', {
      method: 'POST',
      headers,
      body: JSON.stringify({ password }),
    })
    expect(response.status).toBe(401)
  })

  it('apaga tudo do usuário e nada de outro usuário', async () => {
    const goalId = randomUUID()
    const habitId = randomUUID()
    const planId = randomUUID()
    const workoutId = randomUUID()
    const taskId = randomUUID()

    for (const person of [ana, bia]) {
      const id = person === ana ? { goalId, habitId, planId, workoutId, taskId } : {
        goalId: randomUUID(),
        habitId: randomUUID(),
        planId: randomUUID(),
        workoutId: randomUUID(),
        taskId: randomUUID(),
      }
      const writes = [
        put(person, `/goals/${id.goalId}`, { title: 'Meta' }),
        put(person, `/habits/${id.habitId}`, { title: 'Hábito', icon: 'book', weekdays: [1], startDate: DATE }),
        put(person, `/tasks/${id.taskId}`, { title: 'Tarefa', date: DATE }),
      ]
      expect((await Promise.all(writes)).map((response) => response.status)).toEqual([200, 200, 200])

      const linked = [
        put(person, `/milestones/${randomUUID()}`, { title: 'Marco', goalId: id.goalId }),
        put(person, `/workout-plans/${id.planId}`, { title: 'Ficha', habitId: id.habitId, goalId: id.goalId }),
        put(person, `/subtasks/${randomUUID()}`, { title: 'Sub', taskId: id.taskId }),
      ]
      expect((await Promise.all(linked)).map((response) => response.status)).toEqual([200, 200, 200])

      const workout = { planId: id.planId, date: DATE, startedAt: `${DATE}T12:00:00Z` }
      expect((await put(person, `/workout-sessions/${id.workoutId}`, workout)).status).toBe(200)
      const set = {
        sessionId: id.workoutId,
        exerciseRef: 'supino-reto',
        reps: 10,
        doneAt: `${DATE}T12:10:00Z`,
      }
      expect((await put(person, `/session-sets/${randomUUID()}`, set)).status).toBe(200)
      expect((await put(person, `/checks/${id.habitId}/${DATE}`)).status).toBe(204)
      expect((await put(person, '/achievements/habitos-1')).status).toBe(204)
    }

    expect((await deleteUser(ana, password)).status).toBe(200)

    const owned = [
      schema.goals,
      schema.milestones,
      schema.habits,
      schema.habitChecks,
      schema.tasks,
      schema.subtasks,
      schema.workoutPlans,
      schema.workoutSessions,
      schema.sessionSets,
      schema.achievementsSeen,
    ]
    for (const table of owned) {
      expect(await db.select().from(table).where(eq(table.userId, ana.id))).toHaveLength(0)
      expect((await db.select().from(table).where(eq(table.userId, bia.id))).length).toBeGreaterThan(0)
    }

    expect(await db.select().from(schema.user).where(eq(schema.user.id, ana.id))).toHaveLength(0)
    expect(await db.select().from(schema.session).where(eq(schema.session.userId, ana.id))).toHaveLength(0)
    const snapshot = await app.request('/api/snapshot', { headers: { cookie: ana.cookie } })
    expect(snapshot.status).toBe(401)
  })
})
