import type { Goal, Habit, Milestone, Snapshot } from '../data/types'
import { toIsoDate } from './dates'
import { isScheduled, type HabitPlan } from './habits'
import { currentStreak } from './streaks'
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
  const tasks = snapshot.tasks.filter((task) => task.date === date)
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

export function xpOf(snapshot: Snapshot): number {
  return totalXp({
    checks: snapshot.checks,
    tasksDone: snapshot.tasks.filter((task) => task.doneAt).length,
    perfectDays: snapshot.days.filter((day) => day.completedAt).length,
    milestonesDone: snapshot.milestones.filter((milestone) => milestone.doneAt).length,
    goalsDone: snapshot.goals.filter((goal) => goal.status === 'done').length,
  })
}

/** Meta da tela Hoje: a primeira ativa, ou a concluída hoje, para o barco terminar a viagem. */
export function goalInFocus(snapshot: Snapshot, date: string): GoalInFocus | null {
  const finishedToday = (goal: Goal) =>
    goal.status === 'done' && goal.doneAt !== null && toIsoDate(new Date(goal.doneAt)) === date

  const goal =
    snapshot.goals.find((item) => item.status === 'active') ?? snapshot.goals.find(finishedToday)
  if (!goal) return null

  const milestones = snapshot.milestones
    .filter((milestone) => milestone.goalId === goal.id)
    .sort((a, b) => a.position - b.position)

  return { ...goal, milestones, reached: milestones.filter((milestone) => milestone.doneAt).length }
}
