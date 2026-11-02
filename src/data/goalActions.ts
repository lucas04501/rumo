import { milestoneChanges } from '../lib/goals'
import { newId } from '../lib/ids'
import type { GoalInFocus } from '../lib/progress'
import { commit, type Write } from './store'
import type { Goal, Habit, Milestone, Task } from './types'

const now = () => new Date().toISOString()

const putGoal = (goal: Goal, editedAt: string): Write => ({
  method: 'PUT',
  path: `/goals/${goal.id}`,
  body: { ...goal, editedAt },
})

const putMilestone = (milestone: Milestone, editedAt: string): Write => ({
  method: 'PUT',
  path: `/milestones/${milestone.id}`,
  body: { ...milestone, editedAt },
})

// A meta vai primeiro na fila: os marcos dependem dela no banco.
export function saveGoalPlan(goal: Goal, before: Milestone[], after: Milestone[]) {
  const { changed, removed } = milestoneChanges(before, after)
  const editedAt = now()

  commit(
    (current) => ({
      ...current,
      goals: current.goals.some((item) => item.id === goal.id)
        ? current.goals.map((item) => (item.id === goal.id ? goal : item))
        : [...current.goals, goal],
      milestones: [...current.milestones.filter((item) => item.goalId !== goal.id), ...after],
    }),
    [
      putGoal(goal, editedAt),
      ...changed.map((milestone) => putMilestone(milestone, editedAt)),
      ...removed.map((milestone): Write => ({ method: 'DELETE', path: `/milestones/${milestone.id}` })),
    ],
  )
}

export function deleteGoal(id: string) {
  commit(
    (current) => ({ ...current, goals: current.goals.filter((goal) => goal.id !== id) }),
    [{ method: 'DELETE', path: `/goals/${id}` }],
  )
}

/** Conclui o próximo marco. O último conclui a meta junto. */
export function completeNextMilestone(goal: GoalInFocus) {
  const next = goal.milestones[goal.reached]
  if (!next) return

  const editedAt = now()
  const milestone = { ...next, doneAt: editedAt }
  const finishing = goal.reached + 1 === goal.milestones.length
  const { milestones: _milestones, reached: _reached, ...plain } = goal
  const finished: Goal = { ...plain, status: 'done', doneAt: editedAt }

  commit(
    (current) => ({
      ...current,
      milestones: current.milestones.map((item) => (item.id === next.id ? milestone : item)),
      goals: finishing
        ? current.goals.map((item) => (item.id === goal.id ? finished : item))
        : current.goals,
    }),
    [putMilestone(milestone, editedAt), ...(finishing ? [putGoal(finished, editedAt)] : [])],
  )
}

/** Desfaz só o último marco concluído, para o barco nunca pular estações. */
export function undoLastMilestone(goal: GoalInFocus) {
  const last = goal.milestones[goal.reached - 1]
  if (!last) return

  const editedAt = now()
  const milestone = { ...last, doneAt: null }
  const reopening = goal.status === 'done'
  const { milestones: _milestones, reached: _reached, ...plain } = goal
  const reopened: Goal = { ...plain, status: 'active', doneAt: null }

  commit(
    (current) => ({
      ...current,
      milestones: current.milestones.map((item) => (item.id === last.id ? milestone : item)),
      goals: reopening
        ? current.goals.map((item) => (item.id === goal.id ? reopened : item))
        : current.goals,
    }),
    [putMilestone(milestone, editedAt), ...(reopening ? [putGoal(reopened, editedAt)] : [])],
  )
}

/** A meta principal é a que aparece na tela Hoje. */
export function setMainGoal(id: string, goals: Goal[]) {
  const ordered = [...goals].sort((a, b) => Number(b.id === id) - Number(a.id === id))
  const moved = ordered
    .map((goal, position) => ({ ...goal, position }))
    .filter((goal) => goal.position !== goals.find((item) => item.id === goal.id)?.position)
  const editedAt = now()

  commit(
    (current) => ({
      ...current,
      goals: current.goals
        .map((goal) => moved.find((item) => item.id === goal.id) ?? goal)
        .sort((a, b) => a.position - b.position),
    }),
    moved.map((goal) => putGoal(goal, editedAt)),
  )
}

export function linkHabit(habit: Habit, goalId: string | null) {
  const next = { ...habit, goalId }
  commit(
    (current) => ({
      ...current,
      habits: current.habits.map((item) => (item.id === habit.id ? next : item)),
    }),
    [{ method: 'PUT', path: `/habits/${habit.id}`, body: { ...next, editedAt: now() } }],
  )
}

export function linkTask(task: Task, goalId: string | null) {
  const next = { ...task, goalId }
  commit(
    (current) => ({
      ...current,
      tasks: current.tasks.map((item) => (item.id === task.id ? next : item)),
    }),
    [{ method: 'PUT', path: `/tasks/${task.id}`, body: { ...next, editedAt: now() } }],
  )
}

export function addGoalTask(title: string, date: string, goalId: string, position: number) {
  const task: Task = { id: newId(), date, title, goalId, doneAt: null, position }
  commit((current) => ({ ...current, tasks: [...current.tasks, task] }), [
    { method: 'PUT', path: `/tasks/${task.id}`, body: { ...task, editedAt: now() } },
  ])
}
