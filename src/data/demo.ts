// Dados de demonstração para validar a sensação do app. Sai na etapa 4.
import { addDays, weekdayOf } from '../lib/dates'
import { hasTailwind, type XpInput } from '../lib/xp'
import type { HabitIconName } from '../ui/habitIcons'

export type Habit = {
  id: string
  title: string
  icon: HabitIconName
  weekdays: number[]
  startDate: string
}

export type Task = { id: string; title: string; done: boolean }

export type Goal = {
  title: string
  targetDate: string
  milestones: string[]
  reached: number
}

export const USER_NAME = 'Lucas'

const HISTORY_DAYS = 22
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const MONDAY_TO_SATURDAY = [1, 2, 3, 4, 5, 6]

// Garante que o "vento a favor" apareça ao testar, sem depender da sorte do dia.
const WIND_HABIT = 'meditar'

export function isWindy(habitId: string, date: string, today: string): boolean {
  return (habitId === WIND_HABIT && date === today) || hasTailwind(habitId, date)
}

export function createDemo(today: string) {
  const startDate = addDays(today, -HISTORY_DAYS)

  const habits: Habit[] = [
    { id: 'treinar', title: 'Treinar', icon: 'dumbbell', weekdays: MONDAY_TO_SATURDAY, startDate },
    { id: 'ler', title: 'Ler 20 minutos', icon: 'book', weekdays: EVERY_DAY, startDate },
    { id: 'agua', title: 'Beber 2 litros de água', icon: 'water', weekdays: EVERY_DAY, startDate },
    { id: 'meditar', title: 'Meditar', icon: 'flower', weekdays: EVERY_DAY, startDate },
    { id: 'dormir', title: 'Dormir cedo', icon: 'moon', weekdays: EVERY_DAY, startDate },
  ].filter((habit) => habit.weekdays.includes(weekdayOf(today))) as Habit[]

  const history = new Map<string, Set<string>>()
  for (const habit of habits) {
    const dates = new Set<string>()
    for (let back = 1; back <= HISTORY_DAYS; back += 1) {
      const date = addDays(today, -back)
      const scheduled = habit.weekdays.includes(weekdayOf(date))
      const missed = hasTailwind(`${habit.id}-falta`, date)
      if (scheduled && !missed) dates.add(date)
    }
    history.set(habit.id, dates)
  }

  const tasks: Task[] = [
    { id: 'dentista', title: 'Marcar o dentista', done: false },
    { id: 'aluguel', title: 'Pagar o aluguel', done: true },
  ]

  const goal: Goal = {
    title: 'Correr 10 km',
    targetDate: addDays(today, 41),
    milestones: ['Correr 3 km', 'Correr 5 km', 'Correr 7 km', 'Correr 9 km', 'Correr 10 km'],
    reached: 2,
  }

  return { habits, history, tasks, goal, checkedToday: new Set(['ler', 'agua']) }
}

export function historyXp(history: Map<string, Set<string>>, today: string): XpInput {
  const checks = [...history].flatMap(([habitId, dates]) =>
    [...dates].map((date) => ({ habitId, date, tailwind: isWindy(habitId, date, today) })),
  )
  return { checks, tasksDone: 24, perfectDays: 9, milestonesDone: 0, goalsDone: 0 }
}
