import type { Goal, Habit, Milestone, Snapshot } from '../data/types'
import { toIsoDate } from './dates'
import { isScheduled, type HabitPlan } from './habits'
import { currentStreak } from './streaks'
import { mergeDay, tasksOn } from './tasks'
import { recordsOf } from './workouts'
import { totalXp } from './xp'

export type HabitToday = Habit & {
  done: boolean
  streak: number
  anchorUsed: boolean
}

export type GoalInFocus = Goal & {
  milestones: Milestone[]
  reached: number
}

export function planOf(habit: Habit, snapshot: Snapshot): HabitPlan {
  return { ...habit, pauses: snapshot.pauses.filter((pause) => pause.habitId === habit.id) }
}

export function checksOf(habitId: string, snapshot: Snapshot): Set<string> {
  return new Set(snapshot.checks.filter((check) => check.habitId === habitId).map((check) => check.date))
}

export function habitsOn(snapshot: Snapshot, date: string): HabitToday[] {
  return snapshot.habits
    .filter((habit) => isScheduled(planOf(habit, snapshot), date))
    .map((habit) => {
      const checks = checksOf(habit.id, snapshot)
      const { days, anchorUsed } = currentStreak(planOf(habit, snapshot), checks, date)
      return { ...habit, done: checks.has(date), streak: days, anchorUsed }
    })
}

/** Parte do dia concluída, somando hábitos programados e tarefas do dia. */
export function summarizeDay(snapshot: Snapshot, date: string) {
  const habits = habitsOn(snapshot, date)
  const tasks = tasksOn(snapshot, date)
  const done = habits.filter((habit) => habit.done).length + tasks.filter((task) => task.doneAt).length
  const total = habits.length + tasks.length

  return {
    habits,
    tasks,
    done,
    total,
    level: total === 0 ? 0 : done / total,
    remaining: total - done,
    perfect: total > 0 && done === total,
  }
}

export type SnapshotIndex = {
  plans: { id: string; plan: HabitPlan }[]
  checks: Map<string, Set<string>>
  tasks: Map<string, Snapshot['tasks']>
  rules: Snapshot['taskRules']
}

/** Prepara a foto para consultar muitos dias sem refazer as buscas a cada dia. */
export function indexSnapshot(snapshot: Snapshot): SnapshotIndex {
  const checks = new Map<string, Set<string>>()
  for (const { habitId, date } of snapshot.checks) {
    if (!checks.has(habitId)) checks.set(habitId, new Set())
    checks.get(habitId)?.add(date)
  }

  const tasks = new Map<string, Snapshot['tasks']>()
  for (const task of snapshot.tasks) {
    tasks.set(task.date, [...(tasks.get(task.date) ?? []), task])
  }

  return {
    plans: snapshot.habits.map((habit) => ({ id: habit.id, plan: planOf(habit, snapshot) })),
    checks,
    tasks,
    rules: snapshot.taskRules,
  }
}

export const indexedTasks = ({ tasks, rules }: SnapshotIndex, date: string) =>
  mergeDay(tasks.get(date) ?? [], rules, date)

export function dayProgress(index: SnapshotIndex, date: string) {
  const { plans, checks } = index
  const scheduled = plans.filter(({ plan }) => isScheduled(plan, date))
  const habitDone = scheduled.filter(({ id }) => checks.get(id)?.has(date)).length
  const dayTasks = indexedTasks(index, date)
  const done = habitDone + dayTasks.filter((task) => task.doneAt).length
  const total = scheduled.length + dayTasks.length

  return {
    habitDone,
    habitTotal: scheduled.length,
    done,
    total,
    level: total === 0 ? 0 : done / total,
    perfect: total > 0 && done === total,
  }
}

export function xpOf(snapshot: Snapshot): number {
  const index = indexSnapshot(snapshot)

  return totalXp({
    checks: snapshot.checks,
    tasksDone: snapshot.tasks.filter((task) => task.doneAt).length,
    // Marcar o dia à mão registra o dia, mas o bônus é só de quem chegou a 100%.
    perfectDays: snapshot.days.filter((day) => day.completedAt && dayProgress(index, day.date).perfect)
      .length,
    milestonesDone: snapshot.milestones.filter((milestone) => milestone.doneAt).length,
    goalsDone: snapshot.goals.filter((goal) => goal.status === 'done').length,
    records: recordsOf(snapshot).length,
  })
}

export function withMilestones(goal: Goal, snapshot: Snapshot): GoalInFocus {
  const milestones = snapshot.milestones
    .filter((milestone) => milestone.goalId === goal.id)
    .sort((a, b) => a.position - b.position)

  return { ...goal, milestones, reached: milestones.filter((milestone) => milestone.doneAt).length }
}

/** Meta da tela Hoje: a primeira ativa, ou a concluída hoje, para o barco terminar a viagem. */
export function goalInFocus(snapshot: Snapshot, date: string): GoalInFocus | null {
  const finishedToday = (goal: Goal) =>
    goal.status === 'done' && goal.doneAt !== null && toIsoDate(new Date(goal.doneAt)) === date

  const goal =
    snapshot.goals.find((item) => item.status === 'active') ?? snapshot.goals.find(finishedToday)

  return goal ? withMilestones(goal, snapshot) : null
}
