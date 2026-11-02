import { weekdayOf } from './dates'

export type DateRange = { startDate: string; endDate: string }

export type HabitPlan = {
  weekdays: number[]
  startDate: string
  archivedAt?: string | null
  pauses?: DateRange[]
}

export function isPaused(date: string, pauses: DateRange[] = []): boolean {
  return pauses.some((pause) => date >= pause.startDate && date <= pause.endDate)
}

/** Diz se o hábito conta naquele dia: dia da semana certo, já começado, sem pausa. */
export function isScheduled(habit: HabitPlan, date: string): boolean {
  if (habit.archivedAt) return false
  if (date < habit.startDate) return false
  if (isPaused(date, habit.pauses)) return false
  return habit.weekdays.includes(weekdayOf(date))
}

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function describeWeekdays(weekdays: number[]): string {
  if (weekdays.length === 7) return 'Todos os dias'
  const isWorkWeek = weekdays.length === 5 && [1, 2, 3, 4, 5].every((day) => weekdays.includes(day))
  if (isWorkWeek) return 'Segunda a sexta'
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_NAMES[day])
    .join(', ')
}
