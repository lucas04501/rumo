import { randomBytes, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.ALLOW_SIGNUP = 'true'
})

const { inArray, sql } = await import('drizzle-orm')
const { app } = await import('./app.js')
const { claim, db } = await import('./db/client.js')
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
const pauseId = randomUUID()
const ruleId = randomUUID()
const subtaskId = randomUUID()
const focusId = randomUUID()
const stepId = randomUUID()
const routineCheckId = randomUUID()
const planId = randomUUID()
const planExerciseId = randomUUID()
const workoutId = randomUUID()
const setId = randomUUID()
const customId = randomUUID()

const habitBody = { title: 'Treinar', icon: 'dumbbell', weekdays: [1, 3, 5], startDate: DATE }
const ruleBody = { title: 'Regar', weekdays: [1], startDate: DATE }
const focusBody = { date: DATE, startedAt: `${DATE}T12:00:00Z`, minutes: 25, plannedMinutes: 25 }
const stepBody = { weekday: 1, time: '06:30', title: 'Acordar' }
const planExerciseBody = { exerciseRef: 'supino-reto', sets: 3, reps: 10, restSeconds: 90 }
const workoutBody = { date: DATE, startedAt: `${DATE}T12:00:00Z` }
const setBody = { exerciseRef: 'supino-reto', reps: 10, loadKg: 60, doneAt: `${DATE}T12:10:00Z` }
const customBody = { name: 'Exercício da Ana', muscle: 'Peito' }

beforeAll(async () => {
  ana = await signUp('Ana', emails.ana)
  bia = await signUp('Bia', emails.bia)

  const writes = await Promise.all([
    call(ana, 'PUT', `/goals/${goalId}`, { title: 'Meta da Ana' }),
    call(ana, 'PUT', `/tasks/${taskId}`, { title: 'Tarefa da Ana', date: DATE }),
    call(ana, 'PUT', `/notes/${noteId}`, { title: 'Nota da Ana' }),
    call(ana, 'PUT', `/routine-steps/${stepId}`, stepBody),
  ])
  expect(writes.map((response) => response.status)).toEqual([200, 200, 200, 200])

  const dependents = await Promise.all([
    call(ana, 'PUT', `/milestones/${milestoneId}`, { title: 'Marco da Ana', goalId }),
    call(ana, 'PUT', `/habits/${habitId}`, { ...habitBody, goalId }),
    call(ana, 'PUT', `/task-rules/${ruleId}`, { ...ruleBody, title: 'Regra da Ana', goalId }),
    call(ana, 'PUT', `/subtasks/${subtaskId}`, { title: 'Subtarefa da Ana', taskId }),
    call(ana, 'PUT', `/focus-sessions/${focusId}`, { ...focusBody, taskId }),
    call(ana, 'PUT', `/routine-checks/${routineCheckId}`, {
      stepId,
      date: DATE,
      doneAt: `${DATE}T12:00:00Z`,
    }),
  ])
  expect(dependents.map((response) => response.status)).toEqual([200, 200, 200, 200, 200, 200])

  const plan = { title: 'Ficha da Ana', weekdays: [1], habitId, goalId }
  expect((await call(ana, 'PUT', `/workout-plans/${planId}`, plan)).status).toBe(200)
  expect((await call(ana, 'PUT', `/custom-exercises/${customId}`, customBody)).status).toBe(200)
  const planned = await Promise.all([
    call(ana, 'PUT', `/plan-exercises/${planExerciseId}`, { ...planExerciseBody, planId }),
    call(ana, 'PUT', `/workout-sessions/${workoutId}`, { ...workoutBody, planId }),
  ])
  expect(planned.map((response) => response.status)).toEqual([200, 200])
  const set = { ...setBody, sessionId: workoutId }
  expect((await call(ana, 'PUT', `/session-sets/${setId}`, set)).status).toBe(200)

  const pause = { habitId, startDate: DATE, endDate: '2026-11-10' }
  expect((await call(ana, 'PUT', `/pauses/${pauseId}`, pause)).status).toBe(200)
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
  ['task-rules', () => ruleId, { ...ruleBody, title: 'Invadido' }],
  ['subtasks', () => subtaskId, { title: 'Invadido', taskId: randomUUID() }],
  ['focus-sessions', () => focusId, { ...focusBody, minutes: 1 }],
  ['routine-steps', () => stepId, { ...stepBody, title: 'Invadido' }],
  ['routine-checks', () => routineCheckId, { stepId: randomUUID(), date: DATE }],
  ['workout-plans', () => planId, { title: 'Invadido' }],
  ['plan-exercises', () => planExerciseId, { ...planExerciseBody, planId: randomUUID() }],
  ['workout-sessions', () => workoutId, { ...workoutBody, planId: randomUUID() }],
  ['session-sets', () => setId, { ...setBody, sessionId: randomUUID() }],
  ['custom-exercises', () => customId, { ...customBody, name: 'Invadido' }],
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
    ['GET', '/pauses'],
    ['GET', '/task-rules'],
    ['PUT', `/task-rules/${randomUUID()}`],
    ['DELETE', `/task-rules/${randomUUID()}`],
    ['GET', '/subtasks'],
    ['PUT', `/subtasks/${randomUUID()}`],
    ['DELETE', `/subtasks/${randomUUID()}`],
    ['GET', '/focus-sessions'],
    ['PUT', `/focus-sessions/${randomUUID()}`],
    ['DELETE', `/focus-sessions/${randomUUID()}`],
    ['GET', '/routine-steps'],
    ['PUT', `/routine-steps/${randomUUID()}`],
    ['DELETE', `/routine-steps/${randomUUID()}`],
    ['GET', '/routine-checks'],
    ['PUT', `/routine-checks/${randomUUID()}`],
    ['DELETE', `/routine-checks/${randomUUID()}`],
    ['GET', '/workout-plans'],
    ['PUT', `/workout-plans/${randomUUID()}`],
    ['DELETE', `/workout-plans/${randomUUID()}`],
    ['GET', '/plan-exercises'],
    ['PUT', `/plan-exercises/${randomUUID()}`],
    ['DELETE', `/plan-exercises/${randomUUID()}`],
    ['GET', '/workout-sessions'],
    ['PUT', `/workout-sessions/${randomUUID()}`],
    ['DELETE', `/workout-sessions/${randomUUID()}`],
    ['GET', '/session-sets'],
    ['PUT', `/session-sets/${randomUUID()}`],
    ['DELETE', `/session-sets/${randomUUID()}`],
    ['GET', '/custom-exercises'],
    ['PUT', `/custom-exercises/${randomUUID()}`],
    ['DELETE', `/custom-exercises/${randomUUID()}`],
    ['GET', '/achievements'],
    ['PUT', '/achievements/habitos-1'],
    ['GET', '/snapshot'],
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

  it('a foto de um usuário não traz nada do outro', async () => {
    type Snapshot = Record<string, unknown[]> & { user: { name: string } }
    const ofAna = (await (await call(ana, 'GET', '/snapshot')).json()) as Snapshot
    const ofBia = (await (await call(bia, 'GET', '/snapshot')).json()) as Snapshot

    expect(ofAna.user.name).toBe('Ana')
    expect(ofBia.user.name).toBe('Bia')
    const lists = [
      'goals',
      'milestones',
      'habits',
      'pauses',
      'checks',
      'tasks',
      'taskRules',
      'subtasks',
      'focusSessions',
      'routineSteps',
      'routineChecks',
      'notes',
      'days',
      'workoutPlans',
      'planExercises',
      'workoutSessions',
      'sessionSets',
      'customExercises',
    ]
    for (const key of lists) {
      expect(ofAna[key], key).toHaveLength(1)
      expect(JSON.stringify(ofBia[key])).not.toContain('Ana')
    }
    for (const key of lists.filter((name) => name !== 'days')) {
      expect(ofBia[key], key).toHaveLength(0)
    }
  })

  it('conquista vista é de cada usuário, e repetir o envio não muda nada', async () => {
    type Seen = { id: string }[]
    const seenBy = async (person: Person) =>
      (await (await call(person, 'GET', '/achievements')).json()) as Seen
    const photo = async (person: Person) =>
      ((await (await call(person, 'GET', '/snapshot')).json()) as { achievementsSeen: string[] })
        .achievementsSeen

    expect((await call(ana, 'PUT', '/achievements/habitos-1')).status).toBe(204)
    expect((await call(ana, 'PUT', '/achievements/habitos-1')).status).toBe(204)

    expect(await seenBy(ana)).toHaveLength(1)
    expect(await seenBy(bia)).toHaveLength(0)
    expect(await photo(ana)).toEqual(['habitos-1'])
    expect(await photo(bia)).toEqual([])

    expect((await call(bia, 'PUT', '/achievements/habitos-1')).status).toBe(204)
    expect(await seenBy(ana)).toHaveLength(1)
    expect(await seenBy(bia)).toHaveLength(1)
  })

  it('não liga ficha, sessão nem série a dados de outro usuário', async () => {
    const plan = (fields: object) => call(bia, 'PUT', `/workout-plans/${randomUUID()}`, { title: 'Bia', ...fields })
    expect((await plan({ habitId })).status).toBe(404)
    expect((await plan({ goalId })).status).toBe(404)

    const exercise = { ...planExerciseBody, planId }
    expect((await call(bia, 'PUT', `/plan-exercises/${randomUUID()}`, exercise)).status).toBe(404)
    const workout = { ...workoutBody, planId }
    expect((await call(bia, 'PUT', `/workout-sessions/${randomUUID()}`, workout)).status).toBe(404)
    const set = { ...setBody, sessionId: workoutId }
    expect((await call(bia, 'PUT', `/session-sets/${randomUUID()}`, set)).status).toBe(404)
  })

  it('recusa carga fora do limite e ficha sem nome', async () => {
    const heavy = { ...setBody, sessionId: workoutId, loadKg: 5000 }
    expect((await call(ana, 'PUT', `/session-sets/${randomUUID()}`, heavy)).status).toBe(400)
    expect((await call(ana, 'PUT', `/workout-plans/${randomUUID()}`, { title: ' ' })).status).toBe(400)
  })

  it('a RLS segura uma consulta sem filtro de usuário', async () => {
    const [, ofAna] = await db.batch([claim(ana.id), db.select().from(goals)])
    const [, ofBia] = await db.batch([claim(bia.id), db.select().from(goals)])
    expect(ofAna.map((goal) => goal.id)).toContain(goalId)
    expect(ofBia.map((goal) => goal.id)).not.toContain(goalId)
  })

  it('a RLS recusa gravar em nome de outro usuário', async () => {
    const write = db.batch([
      claim(bia.id),
      db.insert(goals).values({ id: randomUUID(), userId: ana.id, title: 'Invadido' }),
    ])
    await expect(write).rejects.toThrow()
  })

  it('toda tabela com dono tem RLS ligada e política', async () => {
    const { rows } = await db.execute<{ tabela: string; rls: boolean; politicas: number }>(sql`
      select c.table_name as tabela,
             k.relrowsecurity as rls,
             (select count(*)::int from pg_policies p where p.tablename = c.table_name) as politicas
      from information_schema.columns c
      join pg_class k on k.relname = c.table_name and k.relkind = 'r'
      where c.table_schema = 'public' and c.column_name = 'user_id'
        and c.table_name not in ('session', 'account')
    `)
    expect(rows.length).toBeGreaterThanOrEqual(19)
    expect(rows.filter((row) => !row.rls || row.politicas === 0)).toEqual([])
  })

  it('recusa identificador de conquista inválido', async () => {
    expect((await call(ana, 'PUT', '/achievements/Nada%20Disso')).status).toBe(400)
  })

  it('guarda o começo da tarefa e devolve na foto', async () => {
    const startedAt = '2026-11-02T12:00:00.000Z'
    const id = randomUUID()
    const body = { title: 'Fazendo', date: DATE, startedAt, editedAt: startedAt }
    expect((await call(ana, 'PUT', `/tasks/${id}`, body)).status).toBe(200)

    const { tasks } = (await (await call(ana, 'GET', '/snapshot')).json()) as {
      tasks: { id: string; startedAt: string | null; doneAt: string | null }[]
    }
    expect(tasks.find((task) => task.id === id)).toMatchObject({ doneAt: null })
    expect(new Date(tasks.find((task) => task.id === id)?.startedAt ?? 0).toISOString()).toBe(startedAt)
    expect((await call(ana, 'DELETE', `/tasks/${id}`)).status).toBe(204)
  })

  it('a foto traz a nota com o vínculo à meta e deixa de trazer depois de excluída', async () => {
    type Note = { id: string; goalId: string | null; title: string; updatedAt: string }
    const notesOf = async (person: Person) =>
      ((await (await call(person, 'GET', '/snapshot')).json()) as { notes: Note[] }).notes

    const id = randomUUID()
    expect((await call(ana, 'PUT', `/notes/${id}`, { title: 'Ligada', goalId })).status).toBe(200)

    const linked = (await notesOf(ana)).find((note) => note.id === id)
    expect(linked?.goalId).toBe(goalId)
    expect(linked?.updatedAt).toBeTruthy()
    expect(await notesOf(bia)).toHaveLength(0)

    expect((await call(ana, 'DELETE', `/notes/${id}`)).status).toBe(204)
    expect((await notesOf(ana)).some((note) => note.id === id)).toBe(false)
  })

  it('não pausa nem altera pausa em hábito de outro usuário', async () => {
    const pause = { habitId, startDate: DATE, endDate: DATE }
    expect((await call(bia, 'PUT', `/pauses/${randomUUID()}`, pause)).status).toBe(404)

    const own = randomUUID()
    await call(bia, 'PUT', `/habits/${own}`, habitBody)
    const takeover = { habitId: own, startDate: DATE, endDate: DATE }
    expect((await call(bia, 'PUT', `/pauses/${pauseId}`, takeover)).status).toBe(404)
    await call(bia, 'DELETE', `/habits/${own}`)
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

  it('não vincula hábito, nota nem tarefa à meta de outro usuário', async () => {
    const habit = await call(bia, 'PUT', `/habits/${randomUUID()}`, { ...habitBody, goalId })
    const note = await call(bia, 'PUT', `/notes/${randomUUID()}`, { title: 'X', goalId })
    const task = await call(bia, 'PUT', `/tasks/${randomUUID()}`, { title: 'X', date: DATE, goalId })
    expect(habit.status).toBe(404)
    expect(note.status).toBe(404)
    expect(task.status).toBe(404)
  })

  it('não vincula nada novo a tarefa, regra ou meta de outro usuário', async () => {
    const own = randomUUID()
    await call(bia, 'PUT', `/tasks/${own}`, { title: 'Da Bia', date: DATE })

    const subtask = await call(bia, 'PUT', `/subtasks/${randomUUID()}`, { title: 'X', taskId })
    const focus = await call(bia, 'PUT', `/focus-sessions/${randomUUID()}`, { ...focusBody, taskId })
    const rule = await call(bia, 'PUT', `/task-rules/${randomUUID()}`, { ...ruleBody, goalId })
    const task = await call(bia, 'PUT', `/tasks/${randomUUID()}`, {
      title: 'X',
      date: DATE,
      ruleId,
    })
    expect(subtask.status).toBe(404)
    expect(focus.status).toBe(404)
    expect(rule.status).toBe(404)
    expect(task.status).toBe(404)

    await call(bia, 'DELETE', `/tasks/${own}`)
  })

  it('não marca passo da rotina de outro usuário', async () => {
    const response = await call(bia, 'PUT', `/routine-checks/${randomUUID()}`, {
      stepId,
      date: DATE,
      doneAt: `${DATE}T12:00:00Z`,
    })
    expect(response.status).toBe(404)
  })

  it('subtasks: não sobrescreve subtarefa de outro usuário usando tarefa própria', async () => {
    const own = randomUUID()
    await call(bia, 'PUT', `/tasks/${own}`, { title: 'Da Bia', date: DATE })

    const response = await call(bia, 'PUT', `/subtasks/${subtaskId}`, { title: 'Invadido', taskId: own })
    expect(response.status).toBe(404)

    const [row] = (await (await call(ana, 'GET', '/subtasks')).json()) as { title: string }[]
    expect(row.title).toBe('Subtarefa da Ana')
    await call(bia, 'DELETE', `/tasks/${own}`)
  })

  it('vincula tarefa à meta do próprio usuário', async () => {
    const id = randomUUID()
    const response = await call(ana, 'PUT', `/tasks/${id}`, { title: 'Ligada', date: DATE, goalId })
    expect(response.status).toBe(200)
    expect(((await response.json()) as { goalId: string }).goalId).toBe(goalId)
    await call(ana, 'DELETE', `/tasks/${id}`)
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

  describe('ocorrência de tarefa recorrente', () => {
    const rule = randomUUID()
    const occurrence = `20261102${rule.slice(8)}`
    const body = { title: 'Regar', date: DATE, ruleId: rule }
    const ofRule = async (person: Person) => {
      const rows = (await (await call(person, 'GET', '/tasks')).json()) as {
        id: string
        doneAt: string | null
        skippedAt: string | null
        ruleId: string | null
        priority: string
      }[]
      return rows.filter((row) => row.ruleId === rule)
    }

    beforeAll(async () => {
      expect((await call(bia, 'PUT', `/task-rules/${rule}`, ruleBody)).status).toBe(200)
    })

    it('dois aparelhos sem internet gravam a mesma linha', async () => {
      const doneAt = new Date(Date.now() - 2_000).toISOString()
      const first = { ...body, doneAt, editedAt: doneAt }
      const second = { ...body, doneAt, editedAt: new Date(Date.now() - 1_000).toISOString() }

      expect((await call(bia, 'PUT', `/tasks/${occurrence}`, first)).status).toBe(200)
      expect((await call(bia, 'PUT', `/tasks/${occurrence}`, second)).status).toBe(200)
      expect(await ofRule(bia)).toHaveLength(1)
    })

    it('uma escrita antiga da fila não desfaz a conclusão mais nova', async () => {
      const older = new Date(Date.now() - 60_000).toISOString()
      const stale = { ...body, doneAt: null, editedAt: older }
      expect((await call(bia, 'PUT', `/tasks/${occurrence}`, stale)).status).toBe(404)

      const [row] = await ofRule(bia)
      expect(row.doneAt).not.toBeNull()
    })

    it('a ocorrência pulada continua na foto, para a regra não recriar', async () => {
      const skippedAt = new Date().toISOString()
      const skip = { ...body, doneAt: null, skippedAt, editedAt: skippedAt }
      expect((await call(bia, 'PUT', `/tasks/${occurrence}`, skip)).status).toBe(200)

      const { tasks } = (await (await call(bia, 'GET', '/snapshot')).json()) as {
        tasks: { id: string; skippedAt: string | null; doneAt: string | null }[]
      }
      const row = tasks.find((task) => task.id === occurrence)
      expect(row?.skippedAt).toBeTruthy()
      expect(row?.doneAt).toBeNull()
    })

    it('tarefa sem prioridade nasce normal, e a prioridade é gravada', async () => {
      const id = randomUUID()
      const plain = await call(bia, 'PUT', `/tasks/${id}`, { title: 'X', date: DATE })
      expect(((await plain.json()) as { priority: string }).priority).toBe('normal')

      const high = { title: 'X', date: DATE, priority: 'high' }
      const edited = await call(bia, 'PUT', `/tasks/${id}`, high)
      expect(((await edited.json()) as { priority: string }).priority).toBe('high')
      await call(bia, 'DELETE', `/tasks/${id}`)
    })
  })
})

describe('validação', () => {
  it('recusa prioridade desconhecida', async () => {
    const body = { title: 'X', date: DATE, priority: 'urgente' }
    expect((await call(bia, 'PUT', `/tasks/${randomUUID()}`, body)).status).toBe(400)
  })

  it('recusa regra sem dias e dia do mês fora do calendário', async () => {
    const noDays = { ...ruleBody, weekdays: [] }
    const badDay = { ...ruleBody, monthDay: 32 }
    expect((await call(bia, 'PUT', `/task-rules/${randomUUID()}`, noDays)).status).toBe(400)
    expect((await call(bia, 'PUT', `/task-rules/${randomUUID()}`, badDay)).status).toBe(400)
  })

  it('recusa passo com horário ou dia inválido', async () => {
    const badTime = { ...stepBody, time: '25:00' }
    const badDay = { ...stepBody, weekday: 7 }
    expect((await call(bia, 'PUT', `/routine-steps/${randomUUID()}`, badTime)).status).toBe(400)
    expect((await call(bia, 'PUT', `/routine-steps/${randomUUID()}`, badDay)).status).toBe(400)
  })

  it('remarcar um passo funciona, e desmarcar some da foto', async () => {
    const step = randomUUID()
    const check = `20261102${step.slice(8)}`
    const checks = async () =>
      ((await (await call(bia, 'GET', '/snapshot')).json()) as { routineChecks: { id: string }[] })
        .routineChecks

    await call(bia, 'PUT', `/routine-steps/${step}`, stepBody)
    const done = (at: string | null, editedAt: string) => ({ stepId: step, date: DATE, doneAt: at, editedAt })
    const moment = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString()

    expect((await call(bia, 'PUT', `/routine-checks/${check}`, done(moment(30), moment(30)))).status).toBe(200)
    expect(await checks()).toHaveLength(1)
    expect((await call(bia, 'PUT', `/routine-checks/${check}`, done(null, moment(20)))).status).toBe(200)
    expect(await checks()).toHaveLength(0)
    expect((await call(bia, 'PUT', `/routine-checks/${check}`, done(moment(10), moment(10)))).status).toBe(200)
    expect(await checks()).toHaveLength(1)
  })

  it('recusa sessão de foco sem duração válida', async () => {
    const body = { ...focusBody, plannedMinutes: 0 }
    expect((await call(bia, 'PUT', `/focus-sessions/${randomUUID()}`, body)).status).toBe(400)
  })

  it('recusa data inválida', async () => {
    expect((await call(bia, 'PUT', `/days/2026-02-30`, {})).status).toBe(400)
  })

  it('recusa ID que não é UUID', async () => {
    expect((await call(bia, 'PUT', '/goals/1', { title: 'X' })).status).toBe(400)
  })

  it('recusa pausa que termina antes de começar', async () => {
    const own = randomUUID()
    await call(ana, 'PUT', `/habits/${own}`, habitBody)
    const backwards = { habitId: own, startDate: '2026-11-10', endDate: '2026-11-02' }
    expect((await call(ana, 'PUT', `/pauses/${randomUUID()}`, backwards)).status).toBe(400)
    await call(ana, 'DELETE', `/habits/${own}`)
  })

  it('recusa título vazio', async () => {
    expect((await call(bia, 'PUT', `/goals/${randomUUID()}`, { title: '   ' })).status).toBe(400)
  })
})
