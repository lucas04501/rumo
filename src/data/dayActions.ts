import { newId } from '../lib/ids'
import { commit } from './store'
import type { Snapshot, Task } from './types'

const now = () => new Date().toISOString()

function patchDay(
  current: Snapshot,
  date: string,
  change: { completedAt?: string | null; note?: string | null },
): Snapshot {
  const existing = current.days.find((day) => day.date === date)
  const day = { date, completedAt: null, note: null, ...existing, ...change }
  return { ...current, days: [...current.days.filter((item) => item.date !== date), day] }
}

export function setDayCompleted(date: string, completedAt: string | null) {
  commit((current) => patchDay(current, date, { completedAt }), [
    { method: 'PUT', path: `/days/${date}`, body: { completedAt, editedAt: now() } },
  ])
}

export function saveDayNote(date: string, note: string) {
  commit((current) => patchDay(current, date, { note }), [
    { method: 'PUT', path: `/days/${date}`, body: { note, editedAt: now() } },
  ])
}

export function addTaskOn(date: string, title: string, position: number) {
  const task: Task = { id: newId(), date, title, goalId: null, doneAt: null, position }
  commit((current) => ({ ...current, tasks: [...current.tasks, task] }), [
    { method: 'PUT', path: `/tasks/${task.id}`, body: { ...task, editedAt: now() } },
  ])
}

export function deleteTask(id: string) {
  commit(
    (current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }),
    [{ method: 'DELETE', path: `/tasks/${id}` }],
  )
}
