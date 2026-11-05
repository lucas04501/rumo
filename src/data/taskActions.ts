import { addDays, formatLongDate } from '../lib/dates'
import { focusedMinutes, isOver, plannedMinutes, type FocusTimer } from '../lib/focus'
import { newId } from '../lib/ids'
import type { QuickAdd } from '../lib/quickAdd'
import {
  describeRule,
  occursOn,
  sameSchedule,
  tasksOn,
  upsertTask,
  type Schedule,
} from '../lib/tasks'
import { addTaskOn, deleteTask } from './dayActions'
import { commit, type Write } from './store'
import type { FocusSession, Snapshot, Subtask, Task, TaskRule } from './types'
import { offerUndo } from './undo'

const now = () => new Date().toISOString()

const putTask = (task: Task, editedAt = now()): Write => ({
  method: 'PUT',
  path: `/tasks/${task.id}`,
  body: { ...task, editedAt },
})

const putRule = (rule: TaskRule, editedAt = now()): Write => ({
  method: 'PUT',
  path: `/task-rules/${rule.id}`,
  body: { ...rule, editedAt },
})

/** Grava a tarefa. Em uma ocorrência sem linha, é isso que cria a linha. */
export function saveTask(task: Task) {
  return commit((current) => ({ ...current, tasks: upsertTask(current.tasks, task) }), [putTask(task)])
}

/** Subtarefas e sessões de foco apontam para uma linha: a ocorrência precisa existir antes. */
export function ensureTask(task: Task, snapshot: Snapshot) {
  if (!snapshot.tasks.some((item) => item.id === task.id)) saveTask(task)
}

/** A linha fica marcada como pulada. Sem ela, a regra recriaria a ocorrência. */
export function skipOccurrence(task: Task) {
  saveTask({ ...task, doneAt: null, skippedAt: now() })
  offerUndo({ message: `${task.title}: pulada`, undo: () => saveTask(task) })
}

/**
 * Some da tela na hora, mas o `DELETE` só entra na fila quando o prazo acaba: a
 * exclusão no servidor não volta. Se o app fechar antes, a tarefa simplesmente fica.
 */
export function removeTask(task: Task) {
  commit((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) }), [])
  offerUndo({
    message: 'Tarefa excluída',
    undo: () =>
      commit((current) => ({ ...current, tasks: upsertTask(current.tasks, task) }), []),
    expire: () => deleteTask(task.id),
  })
}

export function moveTask(task: Task, date: string) {
  saveTask({ ...task, date })
  offerUndo({
    message: `Movida para ${formatLongDate(date).toLowerCase()}`,
    undo: () => saveTask(task),
  })
}

/** Recorrente não muda de dia: o ID vem da data. Ela é pulada, e a regra volta na próxima vez. */
export function postponeTask(task: Task, today: string) {
  if (task.ruleId) skipOccurrence(task)
  else moveTask(task, addDays(task.date < today ? today : task.date, 1))
}

export function bringToToday(tasks: Task[], today: string) {
  const editedAt = now()
  const moved = new Map(tasks.map((task) => [task.id, { ...task, date: today }]))
  const original = new Map(tasks.map((task) => [task.id, task]))

  commit(
    (current) => ({
      ...current,
      tasks: current.tasks.map((task) => moved.get(task.id) ?? task),
    }),
    [...moved.values()].map((task) => putTask(task, editedAt)),
  )
  offerUndo({
    message: tasks.length === 1 ? 'Tarefa trazida para hoje' : `${tasks.length} tarefas trazidas para hoje`,
    undo: () =>
      commit(
        (current) => ({
          ...current,
          tasks: current.tasks.map((task) => original.get(task.id) ?? task),
        }),
        tasks.map((task) => putTask(task)),
      ),
  })
}

/** Salva o que a adição rápida entendeu, e confirma o que não vai aparecer na lista de hoje. */
export function addQuick(intent: QuickAdd, today: string, snapshot: Snapshot) {
  const { title, date, priority, repeat } = intent

  if (repeat) {
    const rule: TaskRule = {
      id: newId(),
      title,
      ...repeat,
      startDate: date,
      endDate: null,
      priority,
      goalId: null,
      position: snapshot.taskRules.length,
    }
    createRule(rule)
    offerUndo({
      message: `Repete: ${describeRule(rule)}`,
      undo: () => stopRule(rule, rule.startDate),
    })
    return
  }

  const task = addTaskOn(date, title, snapshot.tasks.length, priority)
  if (date === today) return
  offerUndo({
    message: `Adicionada para ${formatLongDate(date).toLowerCase()}`,
    undo: () => deleteTask(task.id),
  })
}

export function addSubtask(taskId: string, title: string, position: number) {
  const subtask: Subtask = { id: newId(), taskId, title, position, doneAt: null }
  commit((current) => ({ ...current, subtasks: [...current.subtasks, subtask] }), [
    { method: 'PUT', path: `/subtasks/${subtask.id}`, body: { ...subtask, editedAt: now() } },
  ])
}

export function toggleSubtask(subtask: Subtask) {
  const next = { ...subtask, doneAt: subtask.doneAt ? null : now() }
  commit(
    (current) => ({
      ...current,
      subtasks: current.subtasks.map((item) => (item.id === next.id ? next : item)),
    }),
    [{ method: 'PUT', path: `/subtasks/${next.id}`, body: { ...next, editedAt: now() } }],
  )
}

export function deleteSubtask(id: string) {
  commit(
    (current) => ({ ...current, subtasks: current.subtasks.filter((item) => item.id !== id) }),
    [{ method: 'DELETE', path: `/subtasks/${id}` }],
  )
}

function storeRules(rules: TaskRule[], writes: Write[], tasks?: (current: Task[]) => Task[]) {
  commit(
    (current) => ({
      ...current,
      tasks: tasks ? tasks(current.tasks) : current.tasks,
      taskRules: rules.reduce(
        (list, rule) =>
          list.some((item) => item.id === rule.id)
            ? list.map((item) => (item.id === rule.id ? rule : item))
            : [...list, rule],
        current.taskRules,
      ),
    }),
    writes,
  )
}

export function createRule(rule: TaskRule) {
  storeRules([rule], [putRule(rule)])
}

/**
 * Transforma a tarefa na primeira ocorrência de uma regra. Nunca começa no
 * passado: uma regra nova não pode acrescentar pendências a dias que já foram.
 */
export function startRepeating(task: Task, schedule: Schedule, position: number, today: string) {
  const startDate = task.date > today ? task.date : today
  const rule: TaskRule = {
    id: newId(),
    title: task.title,
    ...schedule,
    startDate,
    endDate: null,
    priority: task.priority,
    goalId: task.goalId,
    position,
  }

  // A regra vai primeiro na fila: a tarefa aponta para ela no banco.
  if (!occursOn(rule, task.date)) return storeRules([rule], [putRule(rule)])
  const linked = { ...task, ruleId: rule.id }
  storeRules([rule], [putRule(rule), putTask(linked)], (tasks) => upsertTask(tasks, linked))
}

/**
 * Título e prioridade mudam na mesma regra. Dias novos nunca reescrevem o passado:
 * a regra antiga termina hoje e uma nova segue a partir de amanhã. Assim, nem o
 * XP de dia perfeito nem as estatísticas mudam com uma edição.
 */
export function updateRule(before: TaskRule, after: TaskRule, today: string) {
  if (sameSchedule(before, after) || before.startDate > today) {
    return storeRules([after], [putRule(after)])
  }

  const ended = { ...before, endDate: today }
  const next = { ...after, id: newId(), startDate: addDays(today, 1), endDate: null }
  const editedAt = now()
  storeRules([ended, next], [putRule(ended, editedAt), putRule(next, editedAt)])
}

/** Para de hoje em diante. O que já passou continua contando como foi. */
export function stopRule(rule: TaskRule, today: string) {
  const ended = { ...rule, endDate: addDays(today, -1) }
  storeRules([ended], [putRule(ended)])
}

/** Registra um bloco de foco. Tarefa excluída ou pulada no meio do bloco fica sem vínculo. */
export function recordFocus(timer: FocusTimer, minutes: number, snapshot: Snapshot) {
  const task = tasksOn(snapshot, timer.date).find((item) => item.id === timer.taskId) ?? null
  if (task) ensureTask(task, snapshot)

  const session: FocusSession = {
    id: timer.sessionId,
    taskId: task?.id ?? null,
    date: timer.date,
    startedAt: timer.startedAt,
    minutes,
    plannedMinutes: plannedMinutes(timer),
  }

  commit(
    (current) => ({
      ...current,
      focusSessions: [
        ...current.focusSessions.filter((item) => item.id !== session.id),
        session,
      ],
    }),
    [
      {
        method: 'PUT',
        path: `/focus-sessions/${session.id}`,
        body: { ...session, editedAt: now() },
      },
    ],
  )
}

/** Encerra antes da hora: registra o que foi feito, se passou de um minuto. */
export function recordPartialFocus(timer: FocusTimer, snapshot: Snapshot, at: number) {
  const minutes = focusedMinutes(timer, at)
  if (timer.phase === 'focus' && !isOver(timer) && minutes >= 1) {
    recordFocus(timer, minutes, snapshot)
  }
}
