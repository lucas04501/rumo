import type { Snapshot, Task } from '../data/types'
import { addDays, formatDayShort, formatShortDate, toIsoDate } from './dates'
import { byPriority, isPlanned, overdueTasks, tasksOn } from './tasks'

export const BOARD_COLUMNS = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Fazendo' },
  { id: 'done', label: 'Feito' },
] as const

export type Column = (typeof BOARD_COLUMNS)[number]['id']

const BOARD_DAYS = 7

/** A coluna vem dos dados. `doneAt` segue sendo a única marca de concluída, e é dela que sai o XP. */
export const columnOf = (task: Pick<Task, 'doneAt' | 'startedAt'>): Column =>
  task.doneAt ? 'done' : task.startedAt ? 'doing' : 'todo'

/** Mover para a mesma coluna devolve a mesma tarefa: não há escrita, nem XP, nem data nova. */
export function placeOn(task: Task, column: Column, at: string): Task {
  if (columnOf(task) === column) return task
  if (column === 'todo') return { ...task, doneAt: null, startedAt: null }
  if (column === 'doing') return { ...task, doneAt: null, startedAt: task.startedAt ?? at }
  return { ...task, doneAt: at }
}

/** Hoje vem primeiro, depois o atraso mais recente e por fim os próximos dias: o atraso antigo não esconde o dia. */
function byUrgency(today: string) {
  const rank = ({ date }: Task) => (date === today ? 0 : date < today ? 1 : 2)

  return (a: Task, b: Task) =>
    rank(a) - rank(b) ||
    (a.date < today ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) ||
    byPriority(a, b)
}

const byNewestDone = (a: Task, b: Task) => (b.doneAt ?? '').localeCompare(a.doneAt ?? '')

/**
 * Atrasadas, os próximos sete dias e o que foi concluído nos últimos sete. O que
 * já foi começado fica até terminar, mesmo que o dia passe. Ocorrência futura sem
 * linha fica de fora: ela não se conclui antes da hora.
 */
export function boardColumns(snapshot: Snapshot, today: string): Record<Column, Task[]> {
  const ahead = Array.from({ length: BOARD_DAYS }, (_, day) => addDays(today, day))
  const planned = ahead
    .flatMap((date) => tasksOn(snapshot, date))
    .filter((task) => !isPlanned(task, today, snapshot.tasks))
  const firstDone = addDays(today, 1 - BOARD_DAYS)
  const kept = snapshot.tasks.filter(
    (task) =>
      !task.skippedAt &&
      (task.doneAt ? toIsoDate(new Date(task.doneAt)) >= firstDone : task.startedAt !== null),
  )

  const tasks = new Map(
    [...overdueTasks(snapshot.tasks, today), ...planned, ...kept].map((task) => [task.id, task]),
  )
  const all = [...tasks.values()]

  return {
    todo: all.filter((task) => columnOf(task) === 'todo').sort(byUrgency(today)),
    doing: all.filter((task) => columnOf(task) === 'doing').sort(byUrgency(today)),
    done: all.filter((task) => columnOf(task) === 'done').sort(byNewestDone),
  }
}

export type TodoGroup = { key: 'today' | 'late' | 'tomorrow' | 'later'; label: string; tasks: Task[] }

/** Separa A fazer em blocos de dia, na ordem de urgência. Bloco vazio não aparece. */
export function groupTodo(tasks: Task[], today: string): TodoGroup[] {
  const tomorrow = addDays(today, 1)
  const keyOf = ({ date }: Task): TodoGroup['key'] =>
    date === today ? 'today' : date < today ? 'late' : date === tomorrow ? 'tomorrow' : 'later'
  const groups: TodoGroup[] = [
    { key: 'today', label: 'Hoje', tasks: [] },
    { key: 'late', label: 'Atrasadas', tasks: [] },
    { key: 'tomorrow', label: 'Amanhã', tasks: [] },
    { key: 'later', label: 'Próximos dias', tasks: [] },
  ]
  for (const task of tasks) groups.find((group) => group.key === keyOf(task))?.tasks.push(task)
  return groups.filter((group) => group.tasks.length > 0)
}

export function dueLabel(date: string, today: string, done: boolean): string {
  if (date === today) return 'Hoje'
  if (date === addDays(today, 1)) return 'Amanhã'
  if (date < today && !done) return `Atrasada, ${formatShortDate(date)}`
  return formatDayShort(date)
}
