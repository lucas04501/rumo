import { addDays, diffDays } from './dates'
import { isScheduled, type HabitPlan } from './habits'

export type Streak = {
  days: number
  anchorUsed: boolean
}

// A âncora perdoa uma falta nesta janela. Duas faltas dentro dela quebram a sequência.
const ANCHOR_WINDOW_DAYS = 7

export function currentStreak(habit: HabitPlan, checks: Set<string>, today: string): Streak {
  let days = 0
  let lastMiss: string | null = null
  let newestMiss: string | null = null
  let bridged = false

  for (let date = today; date >= habit.startDate; date = addDays(date, -1)) {
    // Dia fora do plano ou em pausa não conta nem quebra.
    if (!isScheduled(habit, date)) continue

    if (checks.has(date)) {
      days += 1
      if (lastMiss) bridged = true
      continue
    }

    // Hoje ainda está em aberto: não conta como falta.
    if (date === today) continue

    if (lastMiss && diffDays(lastMiss, date) < ANCHOR_WINDOW_DAYS) break
    lastMiss = date
    newestMiss ??= date
  }

  // Em uso significa que a próxima falta dentro da janela quebra a sequência.
  const anchorUsed = bridged && newestMiss !== null && diffDays(today, newestMiss) < ANCHOR_WINDOW_DAYS

  return { days, anchorUsed }
}
