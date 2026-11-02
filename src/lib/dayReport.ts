import type { Snapshot } from '../data/types'
import { addDays, toIsoDate, weekdayOf, weekOf } from './dates'
import { xpByDate } from './evolution'
import { isScheduled } from './habits'
import {
  checksOf,
  dayProgress,
  indexedTasks,
  planOf,
  type SnapshotIndex,
} from './progress'
import { routineOn, type RoutineLine } from './routine'
import { currentStreak, isStreakMark } from './streaks'
import { finishedSessions, setsOf, summarize } from './workouts'

const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const AVERAGE_WEEKS = 8
const MIN_AVERAGE_DAYS = 3
const MIN_AVERAGE_GAP = 10
const MIN_WEEK_DAYS = 3
const FOCUS_WINDOW_DAYS = 30
const MIN_FOCUS_DAYS = 2

const dayOf = (moment: string) => toIsoDate(new Date(moment))

export type DayReport = {
  /** De 0 a 100. Nulo sem nada programado. */
  percent: number | null
  done: number
  total: number
  xp: number
  focus: { blocks: number; minutes: number; titles: string[] }
  workouts: { id: string; title: string; sets: number; minutes: number }[]
  milestones: string[]
  goals: string[]
  notes: string[]
  routine: RoutineLine[]
  insights: string[]
}

function averageLine(index: SnapshotIndex, date: string, percent: number): string[] {
  const past = Array.from({ length: AVERAGE_WEEKS }, (_, week) => addDays(date, -7 * (week + 1)))
    .map((day) => dayProgress(index, day))
    .filter((day) => day.total > 0)
  if (past.length < MIN_AVERAGE_DAYS) return []

  const average = Math.round((past.reduce((sum, day) => sum + day.level, 0) / past.length) * 100)
  const gap = percent - average
  if (Math.abs(gap) < MIN_AVERAGE_GAP) return []

  const name = WEEKDAY_NAMES[weekdayOf(date)]
  return [
    `${Math.abs(gap)} pontos ${gap > 0 ? 'acima' : 'abaixo'} da sua média de ${name}, que é ${average}%.`,
  ]
}

function bestOfWeekLine(index: SnapshotIndex, date: string, today: string): string[] {
  const days = weekOf(date)
    .filter((day) => day < today)
    .map((day) => ({ day, ...dayProgress(index, day) }))
    .filter((day) => day.total > 0)
  if (days.length < MIN_WEEK_DAYS) return []

  const best = Math.max(...days.map((day) => day.level))
  const leaders = days.filter((day) => day.level === best)
  return leaders.length === 1 && leaders[0].day === date ? ['Melhor dia da semana até aqui.'] : []
}

function streakLines(snapshot: Snapshot, date: string): string[] {
  return snapshot.habits.flatMap((habit) => {
    const plan = planOf(habit, snapshot)
    const checks = checksOf(habit.id, snapshot)
    if (!checks.has(date) || !isScheduled(plan, date)) return []
    const { days } = currentStreak(plan, checks, date)
    return isStreakMark(days) ? [`${habit.title} chegou a ${days} dias seguidos.`] : []
  })
}

function priorityLine(index: SnapshotIndex, date: string): string[] {
  const high = indexedTasks(index, date).filter((task) => task.priority === 'high')
  return high.length > 0 && high.every((task) => task.doneAt)
    ? [high.length === 1 ? 'A prioridade alta foi concluída.' : 'Todas as prioridades altas foram concluídas.']
    : []
}

function focusLine(snapshot: Snapshot, date: string, minutes: number): string[] {
  if (minutes === 0) return []
  const totals = new Map<string, number>()
  const from = addDays(date, -FOCUS_WINDOW_DAYS)

  for (const session of snapshot.focusSessions) {
    if (session.date < from || session.date > date) continue
    totals.set(session.date, (totals.get(session.date) ?? 0) + session.minutes)
  }

  const best = Math.max(...totals.values())
  const leaders = [...totals.values()].filter((total) => total === best).length
  return totals.size >= MIN_FOCUS_DAYS && minutes === best && leaders === 1
    ? ['Seu dia com mais foco nos últimos 30 dias.']
    : []
}

/** Tudo o que aconteceu em um dia. Dia futuro só mostra o planejado, sem frases. */
export function dayReport(
  snapshot: Snapshot,
  index: SnapshotIndex,
  date: string,
  today: string,
): DayReport {
  const { done, total, level } = dayProgress(index, date)
  const percent = total === 0 ? null : Math.round(level * 100)

  const sessions = snapshot.focusSessions.filter((session) => session.date === date)
  const minutes = sessions.reduce((sum, session) => sum + session.minutes, 0)
  const titles = [
    ...new Set(
      sessions.flatMap((session) => {
        const task = snapshot.tasks.find((item) => item.id === session.taskId)
        return task ? [task.title] : []
      }),
    ),
  ]

  const insights =
    date > today
      ? []
      : [
          ...(date < today && percent !== null ? averageLine(index, date, percent) : []),
          ...(date < today ? bestOfWeekLine(index, date, today) : []),
          ...streakLines(snapshot, date),
          ...priorityLine(index, date),
          ...focusLine(snapshot, date, minutes),
        ]

  return {
    percent,
    done,
    total,
    xp: xpByDate(snapshot, index).get(date) ?? 0,
    focus: { blocks: sessions.length, minutes, titles },
    workouts: finishedSessions(snapshot)
      .filter((session) => session.date === date)
      .map((session) => ({
        id: session.id,
        title: snapshot.workoutPlans.find((plan) => plan.id === session.planId)?.title ?? 'Treino',
        ...summarize(session, setsOf(snapshot, session.id), ''),
      })),
    milestones: snapshot.milestones
      .filter((milestone) => milestone.doneAt && dayOf(milestone.doneAt) === date)
      .map((milestone) => milestone.title),
    goals: snapshot.goals
      .filter((goal) => goal.status === 'done' && goal.doneAt && dayOf(goal.doneAt) === date)
      .map((goal) => goal.title),
    notes: snapshot.notes
      .filter((note) => dayOf(note.updatedAt) === date)
      .map((note) => note.title.trim() || note.body.trim().slice(0, 60)),
    routine: routineOn(snapshot, date),
    insights,
  }
}

/** Marcas pequenas das células do calendário: dia com anotação e dia com foco. */
export function calendarMarks(snapshot: Snapshot) {
  const noted = new Set([
    ...snapshot.days.filter((day) => day.note?.trim()).map((day) => day.date),
    ...snapshot.notes.map((note) => dayOf(note.updatedAt)),
  ])
  const focused = new Set(snapshot.focusSessions.map((session) => session.date))
  return { noted, focused }
}
