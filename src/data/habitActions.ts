import { newId } from '../lib/ids'
import { currentPlanView, refuseHabits } from './planGate'
import { commit, currentSnapshot } from './store'
import type { Habit, Pause } from './types'

const editedAt = () => new Date().toISOString()

export function saveHabit(habit: Habit) {
  // Hábito novo, ou arquivado que volta a ficar ativo, só entra se houver vaga. O servidor confere de novo.
  const wasActive = currentSnapshot()?.habits.some((item) => item.id === habit.id && !item.archivedAt)
  if (!habit.archivedAt && !wasActive && !currentPlanView().habitRoom) return refuseHabits()

  commit(
    (current) => ({
      ...current,
      habits: current.habits.some((item) => item.id === habit.id)
        ? current.habits.map((item) => (item.id === habit.id ? habit : item))
        : [...current.habits, habit],
    }),
    [{ method: 'PUT', path: `/habits/${habit.id}`, body: { ...habit, editedAt: editedAt() } }],
  )
}

export function deleteHabit(id: string) {
  commit(
    (current) => ({ ...current, habits: current.habits.filter((habit) => habit.id !== id) }),
    [{ method: 'DELETE', path: `/habits/${id}` }],
  )
}

export function addPause(habitId: string, startDate: string, endDate: string) {
  const pause: Pause = { id: newId(), habitId, startDate, endDate }
  commit((current) => ({ ...current, pauses: [...current.pauses, pause] }), [
    { method: 'PUT', path: `/pauses/${pause.id}`, body: { ...pause, editedAt: editedAt() } },
  ])
}

export function removePause(id: string) {
  commit(
    (current) => ({ ...current, pauses: current.pauses.filter((pause) => pause.id !== id) }),
    [{ method: 'DELETE', path: `/pauses/${id}` }],
  )
}

export function setCheck(habitId: string, date: string, done: boolean) {
  const path = `/checks/${habitId}/${date}`
  commit(
    (current) => {
      const others = current.checks.filter(
        (check) => !(check.habitId === habitId && check.date === date),
      )
      return { ...current, checks: done ? [...others, { habitId, date }] : others }
    },
    [{ method: done ? 'PUT' : 'DELETE', path }],
  )
}
