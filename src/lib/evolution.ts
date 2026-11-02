import type { Snapshot } from '../data/types'
import { addDays, formatLongDate, formatShortDate, toIsoDate, weekdayOf, weekOf } from './dates'
import { consistency } from './goals'
import {
  checksOf,
  dayProgress,
  indexedTasks,
  planOf,
  type SnapshotIndex,
} from './progress'
import { currentStreak } from './streaks'
import { recordsOf } from './workouts'
import { XP, hasTailwind } from './xp'

export const RANGES = [7, 30, 90] as const
export type Range = (typeof RANGES)[number]

const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Abaixo disso, uma frase seria palpite, e não padrão.
const MIN_WEEKDAY_SAMPLES = 2
const MIN_WEEKDAY_GAP = 10
const MIN_MOMENT_SAMPLES = 8
const MIN_MOMENT_SHARE = 0.5
const MIN_HABIT_DAYS = 4
const MIN_HABIT_SHIFT = 15
const MIN_FOCUS_DAYS = 3
const MIN_FOCUS_GAP = 10

const percent = (done: number, total: number) => (total === 0 ? null : Math.round((done / total) * 100))

/** Dias do período. Termina ontem: hoje ainda está em aberto e pareceria falta. */
export function periodDates(today: string, days: number, periodsBack = 0): string[] {
  return Array.from({ length: days }, (_, day) => addDays(today, day - days * (periodsBack + 1)))
}

/** XP ganho em cada dia. A soma de todos os dias é o XP total. */
export function xpByDate(snapshot: Snapshot, index: SnapshotIndex): Map<string, number> {
  const totals = new Map<string, number>()
  const add = (date: string, amount: number) => totals.set(date, (totals.get(date) ?? 0) + amount)
  const dayOf = (moment: string) => toIsoDate(new Date(moment))

  for (const { habitId, date } of snapshot.checks) {
    add(date, XP.habit + (hasTailwind(habitId, date) ? XP.tailwind : 0))
  }
  for (const task of snapshot.tasks) if (task.doneAt) add(dayOf(task.doneAt), XP.task)
  for (const milestone of snapshot.milestones) {
    if (milestone.doneAt) add(dayOf(milestone.doneAt), XP.milestone)
  }
  for (const goal of snapshot.goals) {
    if (goal.status === 'done' && goal.doneAt) add(dayOf(goal.doneAt), XP.goal)
  }
  for (const day of snapshot.days) {
    if (day.completedAt && dayProgress(index, day.date).perfect) add(day.date, XP.perfectDay)
  }
  for (const { date } of recordsOf(snapshot)) add(date, XP.record)

  return totals
}

export type PeriodStats = {
  /** Parte do combinado que foi cumprida, de 0 a 100. Nulo sem nada programado. */
  score: number | null
  habitRate: number | null
  habitDone: number
  habitTotal: number
  taskDone: number
  taskTotal: number
  perfectDays: number
  focusMinutes: number
  focusBlocks: number
  xp: number
}

export function periodStats(snapshot: Snapshot, index: SnapshotIndex, dates: string[]): PeriodStats {
  const inPeriod = new Set(dates)
  const xp = xpByDate(snapshot, index)
  const sessions = snapshot.focusSessions.filter((session) => inPeriod.has(session.date))

  const totals = { done: 0, total: 0, habitDone: 0, habitTotal: 0, perfectDays: 0, xp: 0 }
  for (const date of dates) {
    const day = dayProgress(index, date)
    totals.done += day.done
    totals.total += day.total
    totals.habitDone += day.habitDone
    totals.habitTotal += day.habitTotal
    totals.perfectDays += day.perfect ? 1 : 0
    totals.xp += xp.get(date) ?? 0
  }

  return {
    score: percent(totals.done, totals.total),
    habitRate: percent(totals.habitDone, totals.habitTotal),
    habitDone: totals.habitDone,
    habitTotal: totals.habitTotal,
    taskDone: totals.done - totals.habitDone,
    taskTotal: totals.total - totals.habitTotal,
    perfectDays: totals.perfectDays,
    focusMinutes: sessions.reduce((sum, session) => sum + session.minutes, 0),
    focusBlocks: sessions.length,
    xp: totals.xp,
  }
}

export const scoreDelta = (current: PeriodStats, previous: PeriodStats) =>
  current.score === null || previous.score === null ? null : current.score - previous.score

export function headline(score: number | null, delta: number | null): string {
  if (score === null) return 'Nada programado neste período.'
  if (delta === null) return 'Primeiro período registrado.'
  if (delta === 0) return 'No mesmo ritmo do período anterior.'
  const points = `${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'ponto' : 'pontos'}`
  return `${points} ${delta > 0 ? 'acima' : 'abaixo'} do período anterior.`
}

export type DayPoint = { date: string; level: number | null; done: number; total: number }

export function dailySeries(index: SnapshotIndex, dates: string[]): DayPoint[] {
  return dates.map((date) => {
    const { done, total, level } = dayProgress(index, date)
    return { date, done, total, level: total === 0 ? null : level }
  })
}

/** Dias usados na média da curva: em períodos longos, o sobe e desce diário vira ruído. */
export const SMOOTHING: Record<Range, number> = { 7: 1, 30: 3, 90: 7 }

/** Média dos últimos dias com itens. Dia sem itens segue vazio se a janela inteira estiver vazia. */
export function smoothed(points: DayPoint[], window: number): (number | null)[] {
  return points.map((_, position) => {
    const levels = points
      .slice(Math.max(0, position - window + 1), position + 1)
      .flatMap((point) => (point.level === null ? [] : [point.level]))
    return levels.length === 0 ? null : levels.reduce((sum, level) => sum + level, 0) / levels.length
  })
}

/** Semanas completas de domingo a sábado, com a de hoje por último. Dias futuros ficam nulos. */
export function depthWeeks(index: SnapshotIndex, today: string, weeks: number): (DayPoint | null)[][] {
  const current = weekOf(today)
  return Array.from({ length: weeks }, (_, week) =>
    current
      .map((date) => addDays(date, (week - weeks + 1) * 7))
      .map((date) => (date > today ? null : dailySeries(index, [date])[0])),
  )
}

export const depthOf = ({ level, total, done }: DayPoint) => {
  if (level === null) return 'none'
  if (total > 0 && done === total) return 'full'
  return String(Math.min(3, Math.floor(level * 4)))
}

export type Bucket = { key: string; label: string; value: number; detail: string }

/** Agrupa os dias em colunas: um por dia em 7 dias, uma por semana nos períodos longos. */
export function buckets(
  dates: string[],
  valueOf: (date: string) => number,
  describe: (value: number) => string,
): Bucket[] {
  const size = dates.length <= 7 ? 1 : 7
  const groups: string[][] = []
  for (let end = dates.length; end > 0; end -= size) {
    groups.unshift(dates.slice(Math.max(0, end - size), end))
  }

  return groups.map((group) => {
    const first = group[0]
    const value = group.reduce((sum, date) => sum + valueOf(date), 0)
    const when =
      size === 1
        ? formatLongDate(first)
        : `${formatShortDate(first)} a ${formatShortDate(group[group.length - 1])}`
    return {
      key: first,
      label: size === 1 ? WEEKDAY_SHORT[weekdayOf(first)] : formatShortDate(first),
      value,
      detail: `${when}: ${describe(value)}`,
    }
  })
}

export const tasksDoneOn = (index: SnapshotIndex) => (date: string) =>
  indexedTasks(index, date).filter((task) => task.doneAt).length

export function focusMinutesOn(snapshot: Snapshot) {
  const minutes = new Map<string, number>()
  for (const { date, minutes: amount } of snapshot.focusSessions) {
    minutes.set(date, (minutes.get(date) ?? 0) + amount)
  }
  return (date: string) => minutes.get(date) ?? 0
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`
  const minutes = total % 60
  return minutes === 0 ? `${Math.floor(total / 60)} h` : `${Math.floor(total / 60)} h ${minutes}`
}

export type HabitTrend = {
  id: string
  title: string
  icon: string
  /** De 0 a 100. Nulo sem dias programados no período. */
  rate: number | null
  delta: number | null
  scheduled: number
  streak: number
}

export function habitTrends(snapshot: Snapshot, today: string, days: number): HabitTrend[] {
  return snapshot.habits
    .filter((habit) => !habit.archivedAt)
    .map((habit) => {
      const plan = planOf(habit, snapshot)
      const checks = checksOf(habit.id, snapshot)
      const now = consistency(plan, checks, today, days)
      const before = consistency(plan, checks, addDays(today, -days), days)

      return {
        id: habit.id,
        title: habit.title,
        icon: habit.icon,
        rate: now.percent,
        delta: now.percent === null || before.percent === null ? null : now.percent - before.percent,
        scheduled: now.scheduled,
        streak: currentStreak(plan, checks, today).days,
      }
    })
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
}

/** Tarefas de prioridade alta e recorrentes no período. */
export function taskFocus(index: SnapshotIndex, dates: string[]) {
  const tasks = dates.flatMap((date) => indexedTasks(index, date))
  const high = tasks.filter((task) => task.priority === 'high')
  const repeating = tasks.filter((task) => task.ruleId)
  const done = (list: typeof tasks) => list.filter((task) => task.doneAt).length

  return {
    high: { done: done(high), total: high.length },
    repeating: { done: done(repeating), total: repeating.length },
  }
}

function weekdayPattern(index: SnapshotIndex, dates: string[]): string[] {
  const week = Array.from({ length: 7 }, (_, day) => ({ day, done: 0, total: 0, samples: 0 }))
  for (const date of dates) {
    const { done, total } = dayProgress(index, date)
    if (total === 0) continue
    const entry = week[weekdayOf(date)]
    entry.done += done
    entry.total += total
    entry.samples += 1
  }

  const ranked = week
    .filter((entry) => entry.samples >= MIN_WEEKDAY_SAMPLES)
    .map((entry) => ({ ...entry, rate: entry.done / entry.total }))
    .sort((a, b) => b.rate - a.rate)
  if (ranked.length < 2) return []

  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const gap = Math.round((best.rate - worst.rate) * 100)
  if (gap < MIN_WEEKDAY_GAP) return ['Seu ritmo é parecido em todos os dias da semana.']

  return [
    `${WEEKDAY_NAMES[best.day][0].toUpperCase()}${WEEKDAY_NAMES[best.day].slice(1)} é seu dia mais forte, com ${Math.round(best.rate * 100)}% do combinado. O mais fraco é ${WEEKDAY_NAMES[worst.day]}, com ${Math.round(worst.rate * 100)}%.`,
  ]
}

function momentPattern(snapshot: Snapshot, dates: Set<string>): string[] {
  const moments = { manhã: 0, tarde: 0, noite: 0 }
  const count = (moment: string) => {
    const date = new Date(moment)
    if (!dates.has(toIsoDate(date))) return
    const hour = date.getHours()
    if (hour >= 5 && hour < 12) moments.manhã += 1
    else if (hour >= 12 && hour < 18) moments.tarde += 1
    else moments.noite += 1
  }

  for (const task of snapshot.tasks) if (task.doneAt) count(task.doneAt)
  for (const session of snapshot.focusSessions) count(session.startedAt)

  const ranked = Object.entries(moments).sort((a, b) => b[1] - a[1])
  const total = ranked.reduce((sum, [, amount]) => sum + amount, 0)
  if (total < MIN_MOMENT_SAMPLES || ranked[0][1] / total < MIN_MOMENT_SHARE) return []

  const [name, amount] = ranked[0]
  const where = name === 'manhã' ? 'de manhã' : name === 'tarde' ? 'à tarde' : 'à noite'
  return [`Você rende mais ${where}: ${Math.round((amount / total) * 100)}% das tarefas e focos.`]
}

function focusPattern(snapshot: Snapshot, index: SnapshotIndex, dates: string[]): string[] {
  const focused = new Set(snapshot.focusSessions.map((session) => session.date))
  const sides = { with: { done: 0, total: 0, days: 0 }, without: { done: 0, total: 0, days: 0 } }

  for (const date of dates) {
    const { done, total } = dayProgress(index, date)
    if (total === 0) continue
    const side = focused.has(date) ? sides.with : sides.without
    side.done += done
    side.total += total
    side.days += 1
  }

  if (sides.with.days < MIN_FOCUS_DAYS || sides.without.days < MIN_FOCUS_DAYS) return []
  const withFocus = percent(sides.with.done, sides.with.total) ?? 0
  const without = percent(sides.without.done, sides.without.total) ?? 0
  if (withFocus - without < MIN_FOCUS_GAP) return []
  return [`Nos dias com foco, você cumpre ${withFocus}% do combinado, contra ${without}% nos outros.`]
}

function habitPattern(trends: HabitTrend[]): string[] {
  const steady = trends.filter(
    (trend) => trend.delta !== null && trend.scheduled >= MIN_HABIT_DAYS,
  )
  const rising = [...steady].sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0]
  const falling = [...steady].sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))[0]
  const lines: string[] = []

  if (rising && (rising.delta ?? 0) >= MIN_HABIT_SHIFT) {
    lines.push(`${rising.title} subiu ${rising.delta} pontos.`)
  }
  if (falling && (falling.delta ?? 0) <= -MIN_HABIT_SHIFT) {
    lines.push(`${falling.title} caiu ${Math.abs(falling.delta ?? 0)} pontos. Vale olhar com carinho.`)
  }
  return lines
}

/** Frases geradas por regras. Só diz o que os dados sustentam, e com poucos dados não diz nada. */
export function patterns(
  snapshot: Snapshot,
  index: SnapshotIndex,
  today: string,
  dates: string[],
): string[] {
  return [
    ...weekdayPattern(index, dates),
    ...momentPattern(snapshot, new Set(dates)),
    ...focusPattern(snapshot, index, dates),
    ...habitPattern(habitTrends(snapshot, today, dates.length)),
  ]
}
