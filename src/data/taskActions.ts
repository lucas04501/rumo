import { addDays } from '../lib/dates'
import { focusedMinutes, isOver, plannedMinutes, type FocusTimer } from '../lib/focus'
import { newId } from '../lib/ids'
import { occursOn, sameSchedule, tasksOn, upsertTask, type Schedule } from '../lib/tasks'
import { commit, type Write } from './store'
import type { FocusSession, Snapshot, Subtask, Task, TaskRule } from './types'

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
  commit((current) => ({ ...current, tasks: upsertTask(current.tasks, task) }), [putTask(task)])
}

/** Subtarefas e sessões de foco apontam para uma linha: a ocorrência precisa existir antes. */
export function ensureTask(task: Task, snapshot: Snapshot) {
  if (!snapshot.tasks.some((item) => item.id === task.id)) saveTask(task)
}

/** A linha fica marcada como pulada. Sem ela, a regra recriaria a ocorrência. */
export function skipOccurrence(task: Task) {
  saveTask({ ...task, doneAt: null, skippedAt: now() })
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
