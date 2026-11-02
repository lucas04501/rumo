import { describe, expect, it } from 'vitest'
import type { Snapshot, Task, TaskRule } from '../data/types'
import { indexSnapshot, dayProgress, summarizeDay, xpOf } from './progress'
import {
  describeRule,
  goalTasks,
  isPlanned,
  newTask,
  occurrenceId,
  occursOn,
  sameSchedule,
  tasksOn,
  upsertTask,
} from './tasks'
import { XP } from './xp'

const MONDAY = '2026-11-02'
const TUESDAY = '2026-11-03'
const RULE_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

const rule = (overrides: Partial<TaskRule> = {}): TaskRule => ({
  id: RULE_ID,
  title: 'Regar',
  weekdays: [1],
  monthDay: null,
  startDate: MONDAY,
  endDate: null,
  priority: 'normal',
  goalId: null,
  position: 0,
  ...overrides,
})

const task = (id: string, overrides: Partial<Task> = {}): Task =>
  newTask({ id, date: MONDAY, title: id, position: 1, ...overrides })

const snapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  user: { name: 'Ana' },
  goals: [],
  milestones: [],
  habits: [],
  pauses: [],
  checks: [],
  tasks: [],
  taskRules: [],
  subtasks: [],
  focusSessions: [],
  routineSteps: [],
  routineChecks: [],
  achievementsSeen: [],
  workoutPlans: [],
  planExercises: [],
  workoutSessions: [],
  sessionSets: [],
  customExercises: [],
  notes: [],
  days: [],
  ...overrides,
})

describe('occursOn', () => {
  it('segue os dias da semana entre o início e o fim', () => {
    const weekly = rule({ endDate: '2026-11-09' })
    expect(occursOn(weekly, '2026-10-26')).toBe(false)
    expect(occursOn(weekly, MONDAY)).toBe(true)
    expect(occursOn(weekly, TUESDAY)).toBe(false)
    expect(occursOn(weekly, '2026-11-09')).toBe(true)
    expect(occursOn(weekly, '2026-11-16')).toBe(false)
  })

  it('com dia do mês, ignora os dias da semana', () => {
    const monthly = rule({ monthDay: 5, startDate: '2026-01-01' })
    expect(occursOn(monthly, '2026-11-05')).toBe(true)
    expect(occursOn(monthly, MONDAY)).toBe(false)
  })

  it('em mês curto, cai no último dia', () => {
    const monthly = rule({ monthDay: 31, startDate: '2026-01-01' })
    expect(occursOn(monthly, '2026-02-28')).toBe(true)
    expect(occursOn(monthly, '2026-04-30')).toBe(true)
    expect(occursOn(monthly, '2026-05-30')).toBe(false)
    expect(occursOn(monthly, '2026-05-31')).toBe(true)
  })
})

describe('occurrenceId', () => {
  it('dá o mesmo ID em qualquer aparelho e continua sendo um UUID válido', () => {
    const id = occurrenceId(RULE_ID, MONDAY)
    expect(id).toBe('20261102-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(id).toBe(occurrenceId(RULE_ID, MONDAY))
    expect(id).not.toBe(occurrenceId(RULE_ID, TUESDAY))
  })
})

describe('tasksOn', () => {
  it('mostra a ocorrência sem criar linha', () => {
    const data = snapshot({ taskRules: [rule()] })
    const [occurrence] = tasksOn(data, MONDAY)
    expect(occurrence).toMatchObject({ title: 'Regar', ruleId: RULE_ID, doneAt: null })
    expect(data.tasks).toHaveLength(0)
  })

  it('a linha substitui a ocorrência, sem duplicar', () => {
    const row = task(occurrenceId(RULE_ID, MONDAY), { ruleId: RULE_ID, doneAt: '2026-11-02T12:00:00Z' })
    const tasks = tasksOn(snapshot({ taskRules: [rule()], tasks: [row] }), MONDAY)
    expect(tasks).toEqual([row])
  })

  it('uma tarefa ligada à regra com outro ID também conta como a ocorrência do dia', () => {
    const row = task('convertida', { ruleId: RULE_ID })
    expect(tasksOn(snapshot({ taskRules: [rule()], tasks: [row] }), MONDAY)).toEqual([row])
  })

  it('a ocorrência pulada some e não volta', () => {
    const row = task(occurrenceId(RULE_ID, MONDAY), {
      ruleId: RULE_ID,
      skippedAt: '2026-11-02T12:00:00Z',
    })
    expect(tasksOn(snapshot({ taskRules: [rule()], tasks: [row] }), MONDAY)).toEqual([])
  })

  it('ordena por prioridade e mantém a ordem dentro de cada uma', () => {
    const tasks = [
      task('baixa', { priority: 'low', position: 0 }),
      task('normal-2', { position: 2 }),
      task('normal-1', { position: 1 }),
      task('alta', { priority: 'high', position: 3 }),
    ]
    expect(tasksOn(snapshot({ tasks }), MONDAY).map((item) => item.id)).toEqual([
      'alta',
      'normal-1',
      'normal-2',
      'baixa',
    ])
  })
})

describe('recorrência, XP e maré', () => {
  const done = '2026-11-02T12:00:00Z'
  const id = occurrenceId(RULE_ID, MONDAY)

  it('a ocorrência conta na maré do dia e não vale XP sem concluir', () => {
    const data = snapshot({ taskRules: [rule()] })
    expect(summarizeDay(data, MONDAY)).toMatchObject({ total: 1, done: 0, remaining: 1 })
    expect(xpOf(data)).toBe(0)
  })

  it('concluir uma ocorrência vale uma tarefa só, mesmo repetindo a escrita', () => {
    const row = task(id, { ruleId: RULE_ID, doneAt: done })
    const tasks = upsertTask(upsertTask([], row), row)
    expect(xpOf(snapshot({ taskRules: [rule()], tasks }))).toBe(XP.task)
  })

  it('desfazer tira o XP da ocorrência', () => {
    const tasks = [task(id, { ruleId: RULE_ID, doneAt: null })]
    expect(xpOf(snapshot({ taskRules: [rule()], tasks }))).toBe(0)
  })

  it('pular uma ocorrência não vale XP e fecha o dia sem ela', () => {
    const tasks = [task(id, { ruleId: RULE_ID, skippedAt: done })]
    const data = snapshot({ taskRules: [rule()], tasks })
    expect(xpOf(data)).toBe(0)
    expect(summarizeDay(data, MONDAY).total).toBe(0)
  })

  it('dia com ocorrência em aberto não é perfeito', () => {
    const tasks = [task('feita', { doneAt: done })]
    const days = [{ date: MONDAY, completedAt: done, note: null }]
    const data = snapshot({ taskRules: [rule()], tasks, days })
    expect(dayProgress(indexSnapshot(data), MONDAY).perfect).toBe(false)
    expect(xpOf(data)).toBe(XP.task)
  })

  it('o histórico não muda ao encerrar a regra hoje', () => {
    const open = snapshot({ taskRules: [rule({ weekdays: [1, 2] })] })
    const ended = snapshot({ taskRules: [rule({ weekdays: [1, 2], endDate: MONDAY })] })
    expect(summarizeDay(ended, MONDAY).total).toBe(summarizeDay(open, MONDAY).total)
    expect(summarizeDay(ended, TUESDAY).total).toBe(0)
  })
})

describe('apoio', () => {
  it('goalTasks junta as linhas da meta às ocorrências de hoje, sem as puladas', () => {
    const data = snapshot({
      taskRules: [rule({ goalId: 'g' })],
      tasks: [
        task('ligada', { goalId: 'g', date: '2026-10-30' }),
        task('pulada', { goalId: 'g', skippedAt: '2026-11-02T12:00:00Z' }),
      ],
    })
    expect(goalTasks(data, 'g', MONDAY).map((item) => item.title)).toEqual(['ligada', 'Regar'])
  })

  it('isPlanned separa a ocorrência futura sem linha', () => {
    const planned = task(occurrenceId(RULE_ID, TUESDAY), { date: TUESDAY, ruleId: RULE_ID })
    expect(isPlanned(planned, MONDAY, [])).toBe(true)
    expect(isPlanned(planned, MONDAY, [planned])).toBe(false)
    expect(isPlanned(planned, TUESDAY, [])).toBe(false)
    expect(isPlanned(task('comum', { date: TUESDAY }), MONDAY, [])).toBe(false)
  })

  it('describeRule e sameSchedule', () => {
    expect(describeRule(rule({ monthDay: 5 }))).toBe('Todo dia 5')
    expect(describeRule(rule({ weekdays: [1, 2, 3, 4, 5] }))).toBe('Segunda a sexta')
    expect(sameSchedule(rule({ weekdays: [2, 1] }), rule({ weekdays: [1, 2] }))).toBe(true)
    expect(sameSchedule(rule(), rule({ monthDay: 3 }))).toBe(false)
  })
})
