import type { Snapshot } from '../data/types'
import { weekdayOf } from './dates'
import { dayProgress, indexSnapshot } from './progress'

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MIN_WEEKDAY_SAMPLES = 2

export const monthOf = (iso: string) => iso.slice(0, 7)

export function shiftMonth(month: string, amount: number): string {
  const [year, index] = month.split('-').map(Number)
  const date = new Date(year, index - 1 + amount, 1, 12)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthDays(month: string): string[] {
  const [year, index] = month.split('-').map(Number)
  const count = new Date(year, index, 0).getDate()
  return Array.from({ length: count }, (_, day) => `${month}-${String(day + 1).padStart(2, '0')}`)
}

/** Dias do mês com vazios no início, para a grade começar no domingo. */
export function monthGrid(month: string): (string | null)[] {
  const days = monthDays(month)
  return [...Array.from({ length: weekdayOf(days[0]) }, () => null), ...days]
}

export function monthName(month: string): string {
  const [year, index] = month.split('-').map(Number)
  return new Date(year, index - 1, 1, 12).toLocaleDateString('pt-BR', { month: 'long' })
}

export type MonthSummary = {
  daysDone: number
  daysElapsed: number
  /** Hábitos cumpridos entre os programados, de 0 a 100. Nulo sem nada programado. */
  consistency: number | null
  bestRun: number
  strongestWeekday: string | null
}

export function summarizeMonth(snapshot: Snapshot, month: string, today: string): MonthSummary {
  const index = indexSnapshot(snapshot)
  const completed = new Set(snapshot.days.filter((day) => day.completedAt).map((day) => day.date))
  const days = monthDays(month).filter((date) => date <= today)

  const byWeekday = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }))
  let habitDone = 0
  let habitTotal = 0
  let run = 0
  let bestRun = 0

  for (const date of days) {
    const progress = dayProgress(index, date)
    const weekday = byWeekday[weekdayOf(date)]
    habitDone += progress.habitDone
    habitTotal += progress.habitTotal
    weekday.done += progress.habitDone
    weekday.total += progress.habitTotal

    run = completed.has(date) ? run + 1 : 0
    bestRun = Math.max(bestRun, run)
  }

  const ranked = byWeekday
    .map((weekday, day) => ({ day, ...weekday, rate: weekday.total ? weekday.done / weekday.total : 0 }))
    .filter((weekday) => weekday.total >= MIN_WEEKDAY_SAMPLES && weekday.done > 0)
    .sort((a, b) => b.rate - a.rate)

  return {
    daysDone: days.filter((date) => completed.has(date)).length,
    daysElapsed: days.length,
    consistency: habitTotal === 0 ? null : Math.round((habitDone / habitTotal) * 100),
    bestRun,
    strongestWeekday: ranked.length > 0 ? WEEKDAY_NAMES[ranked[0].day] : null,
  }
}

/** Frases do resumo do mês, geradas por regras. Só diz o que os dados sustentam. */
export function monthInsights(snapshot: Snapshot, month: string, today: string): string[] {
  const summary = summarizeMonth(snapshot, month, today)
  if (summary.daysElapsed === 0) return []
  if (summary.consistency === null && summary.daysDone === 0) return []

  const previousMonth = shiftMonth(month, -1)
  const previous = summarizeMonth(snapshot, previousMonth, today)
  const lines = [
    `${summary.daysDone} de ${summary.daysElapsed} ${summary.daysElapsed === 1 ? 'dia concluído' : 'dias concluídos'}.`,
  ]

  if (summary.consistency !== null) lines.push(`${summary.consistency}% dos hábitos cumpridos.`)
  if (summary.bestRun >= 2) lines.push(`Melhor sequência: ${summary.bestRun} dias seguidos.`)
  if (summary.strongestWeekday) lines.push(`${summary.strongestWeekday} é seu dia mais forte.`)

  if (summary.consistency !== null && previous.consistency !== null) {
    const delta = summary.consistency - previous.consistency
    const name = monthName(previousMonth)
    if (delta === 0) lines.push(`No mesmo ritmo de ${name}.`)
    else lines.push(`${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'ponto' : 'pontos'} ${delta > 0 ? 'acima' : 'abaixo'} de ${name}.`)
  }

  return lines
}
