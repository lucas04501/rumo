import type { Snapshot } from '../data/types'
import { ACHIEVEMENTS, type Measure } from './achievements'
import { addDays, diffDays, toIsoDate } from './dates'
import { focusMinutesOn, xpByDate } from './evolution'
import { checksOf, dayProgress, indexSnapshot, planOf } from './progress'
import { bestStreak } from './streaks'
import { exerciseOf, finishedSessions, formatLoad, recordsOf, setsOf } from './workouts'
import { rankFor } from './xp'

export type TimelineKind = 'achievement' | 'rank' | 'record' | 'milestone' | 'goal' | 'workout'

export type TimelineEvent = {
  id: string
  /** Dia local, YYYY-MM-DD. */
  date: string
  kind: TimelineKind
  title: string
  detail: string
}

const dayOf = (moment: string) => toIsoDate(new Date(moment))

type Walked = { date: string; habits: number; tasks: number; perfectDays: number; focus: number }

/**
 * A conquista não guarda a data em que saiu: ela é recalculada dos dados, andando dia a
 * dia com os mesmos agregados de `totals()`. Medalha que só existe em `achievementsSeen`,
 * por algo desmarcado depois, não tem dia para mostrar e fica fora.
 */
function achievementDays(snapshot: Snapshot, walked: Walked[], today: string) {
  const dated: Record<'milestones' | 'goals' | 'workouts' | 'records', string[]> = {
    milestones: snapshot.milestones.flatMap(({ doneAt }) => (doneAt ? [dayOf(doneAt)] : [])),
    goals: snapshot.goals.flatMap(({ status, doneAt }) =>
      status === 'done' && doneAt ? [dayOf(doneAt)] : [],
    ),
    workouts: finishedSessions(snapshot).map(({ date }) => date),
    records: recordsOf(snapshot).map(({ date }) => date),
  }
  for (const days of Object.values(dated)) days.sort()

  const plans = snapshot.habits.map((habit) => ({
    plan: planOf(habit, snapshot),
    checks: checksOf(habit.id, snapshot),
  }))

  // A maior sequência só cresce com o tempo, então dá para achar o dia por bisseção.
  const streakDay = (target: number) =>
    plans
      .flatMap(({ plan, checks }) => {
        if (bestStreak(plan, checks, today) < target) return []
        let low = 0
        let high = diffDays(today, plan.startDate)
        while (low < high) {
          const mid = Math.floor((low + high) / 2)
          if (bestStreak(plan, checks, addDays(plan.startDate, mid)) >= target) high = mid
          else low = mid + 1
        }
        return [addDays(plan.startDate, low)]
      })
      .sort()[0]

  return (measure: Measure, target: number): string | undefined => {
    if (measure === 'streak') return streakDay(target)
    if (measure === 'habits' || measure === 'tasks' || measure === 'perfectDays' || measure === 'focus') {
      return walked.find((point) => point[measure] >= target)?.date
    }
    return dated[measure][target - 1]
  }
}

/** Do mais recente ao mais antigo. Tudo sai da foto, nada é guardado. */
export function timelineOf(snapshot: Snapshot, today: string): TimelineEvent[] {
  const index = indexSnapshot(snapshot)
  const xp = xpByDate(snapshot, index)
  const focus = focusMinutesOn(snapshot)

  const first = [
    today,
    ...xp.keys(),
    ...snapshot.habits.map(({ startDate }) => startDate),
    ...snapshot.tasks.map(({ date }) => date),
    ...snapshot.focusSessions.map(({ date }) => date),
  ].reduce((earliest, date) => (date < earliest ? date : earliest))

  const total = { habits: 0, tasks: 0, perfectDays: 0, focus: 0 }
  const walked: Walked[] = Array.from({ length: diffDays(today, first) + 1 }, (_, step) => {
    const date = addDays(first, step)
    const day = dayProgress(index, date)
    total.habits += day.habitDone
    total.tasks += day.done - day.habitDone
    total.perfectDays += day.perfect ? 1 : 0
    total.focus += focus(date)
    return { date, ...total }
  })

  const events: TimelineEvent[] = []

  let xpSoFar = 0
  let level = 0
  for (const { date } of walked) {
    xpSoFar += xp.get(date) ?? 0
    const rank = rankFor(xpSoFar)
    if (rank.level > level) {
      events.push({ id: `rank:${rank.level}`, date, kind: 'rank', title: rank.name, detail: 'Nova patente' })
      level = rank.level
    }
  }

  for (const goal of snapshot.goals) {
    if (goal.status === 'done' && goal.doneAt) {
      events.push({ id: `goal:${goal.id}`, date: dayOf(goal.doneAt), kind: 'goal', title: goal.title, detail: 'Meta concluída' })
    }
  }

  for (const milestone of snapshot.milestones) {
    if (!milestone.doneAt) continue
    const goal = snapshot.goals.find(({ id }) => id === milestone.goalId)
    events.push({
      id: `milestone:${milestone.id}`,
      date: dayOf(milestone.doneAt),
      kind: 'milestone',
      title: milestone.title,
      detail: goal ? `Marco · ${goal.title}` : 'Marco',
    })
  }

  const dayReached = achievementDays(snapshot, walked, today)
  for (const { id, title, detail, measure, target } of ACHIEVEMENTS) {
    const date = dayReached(measure, target)
    if (date) events.push({ id: `achievement:${id}`, date, kind: 'achievement', title, detail: `Conquista · ${detail}` })
  }

  for (const { sessionId, date, exerciseRef, loadKg } of recordsOf(snapshot)) {
    events.push({
      id: `record:${sessionId}:${exerciseRef}`,
      date,
      kind: 'record',
      title: exerciseOf(exerciseRef, snapshot.customExercises).name,
      detail: `Recorde de carga · ${formatLoad(loadKg)}`,
    })
  }

  for (const session of finishedSessions(snapshot)) {
    const minutes = Math.max(
      1,
      Math.round((new Date(session.finishedAt ?? session.startedAt).getTime() - new Date(session.startedAt).getTime()) / 60_000),
    )
    const sets = setsOf(snapshot, session.id).length
    events.push({
      id: `workout:${session.id}`,
      date: session.date,
      kind: 'workout',
      title: snapshot.workoutPlans.find(({ id }) => id === session.planId)?.title ?? 'Treino',
      detail: `Treino · ${minutes} min${sets > 0 ? ` · ${sets} ${sets === 1 ? 'série' : 'séries'}` : ''}`,
    })
  }

  // A ordenação é estável: no mesmo dia, ficam na ordem em que foram juntados acima.
  return events.sort((a, b) => b.date.localeCompare(a.date))
}
