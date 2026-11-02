import type { Priority, Snapshot, Task, TaskRule } from '../data/types'
import { weekdayOf } from './dates'
import { describeWeekdays } from './habits'

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, normal: 1, low: 2 }

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Baixa' },
]

export type Schedule = Pick<TaskRule, 'weekdays' | 'monthDay'>

export const newTask = (
  fields: Pick<Task, 'id' | 'date' | 'title' | 'position'> & Partial<Task>,
): Task => ({
  goalId: null,
  doneAt: null,
  priority: 'normal',
  ruleId: null,
  skippedAt: null,
  startedAt: null,
  ...fields,
})

export function occursOn(rule: TaskRule, date: string): boolean {
  if (date < rule.startDate) return false
  if (rule.endDate && date > rule.endDate) return false
  if (rule.monthDay === null) return rule.weekdays.includes(weekdayOf(date))

  // Mês curto: "todo dia 31" cai no último dia.
  const [year, month, day] = date.split('-').map(Number)
  return day === Math.min(rule.monthDay, new Date(year, month, 0).getDate())
}

/**
 * Regra e data decidem o ID. Dois aparelhos sem internet gravam a mesma linha,
 * e o PUT idempotente impede a duplicata.
 */
export function occurrenceId(ruleId: string, date: string): string {
  return `${date.replaceAll('-', '')}${ruleId.slice(8)}`
}

function occurrence(rule: TaskRule, date: string): Task {
  const { id, title, goalId, position, priority } = rule
  return newTask({ id: occurrenceId(id, date), date, title, goalId, position, priority, ruleId: id })
}

export const byPriority = (a: Task, b: Task) =>
  PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.position - b.position

/** Junta as linhas do dia às ocorrências ainda sem linha. Uma linha pulada segura a regra. */
export function mergeDay(rows: Task[], rules: TaskRule[], date: string): Task[] {
  const taken = new Set(rows.map((task) => task.ruleId))
  const planned = rules
    .filter((rule) => !taken.has(rule.id) && occursOn(rule, date))
    .map((rule) => occurrence(rule, date))

  return [...rows.filter((task) => !task.skippedAt), ...planned].sort(byPriority)
}

export function tasksOn(snapshot: Snapshot, date: string): Task[] {
  const rows = snapshot.tasks.filter((task) => task.date === date)
  return mergeDay(rows, snapshot.taskRules, date)
}

/** Tarefas da meta: as que têm linha, em qualquer dia, mais as ocorrências de hoje. */
export function goalTasks(snapshot: Snapshot, goalId: string, today: string): Task[] {
  const rows = snapshot.tasks.filter((task) => task.goalId === goalId && !task.skippedAt)
  const planned = tasksOn(snapshot, today).filter(
    (task) => task.goalId === goalId && !rows.some((row) => row.id === task.id),
  )
  return [...rows, ...planned].sort((a, b) => Number(Boolean(a.doneAt)) - Number(Boolean(b.doneAt)))
}

/** Tarefas comuns de dias passados que ninguém concluiu. Recorrentes não entram: amanhã há outra. */
export function overdueTasks(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((task) => task.date < today && !task.doneAt && !task.skippedAt && !task.ruleId)
    .sort(byPriority)
}

export function upsertTask(tasks: Task[], task: Task): Task[] {
  return tasks.some((item) => item.id === task.id)
    ? tasks.map((item) => (item.id === task.id ? task : item))
    : [...tasks, task]
}

/** Ocorrência futura ainda sem linha: aparece no planejamento, mas não se conclui antes da hora. */
export const isPlanned = (task: Task, today: string, rows: Task[]) =>
  task.ruleId !== null && task.date > today && !rows.some((row) => row.id === task.id)

export function describeRule({ weekdays, monthDay }: Schedule): string {
  return monthDay === null ? describeWeekdays(weekdays) : `Todo dia ${monthDay}`
}

export const sameSchedule = (a: Schedule, b: Schedule) =>
  a.monthDay === b.monthDay &&
  [...a.weekdays].sort().join() === [...b.weekdays].sort().join()
