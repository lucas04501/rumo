import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { FRASES_VENTO, pick } from '../content/frases'
import { diffDays } from '../lib/dates'
import {
  haptic,
  soundArrival,
  soundCelebration,
  soundCheck,
  soundUncheck,
  soundWind,
} from '../lib/feedback'
import { newId } from '../lib/ids'
import {
  goalInFocus,
  summarizeDay,
  withMilestones,
  xpOf,
  type GoalInFocus,
  type HabitToday,
} from '../lib/progress'
import { XP, hasTailwind, rankFor, type Rank } from '../lib/xp'
import { ConnectionNeeded } from '../ui/ConnectionNeeded'
import { setDayCompleted } from './dayActions'
import { completeNextMilestone } from './goalActions'
import { commit, useSnapshot } from './store'
import type { Snapshot, Task } from './types'
import { useToday } from './useToday'

export type { HabitToday } from '../lib/progress'

export type Celebration = { title: string; detail: string }

type Day = {
  date: string
  name: string
  hasHabits: boolean
  habits: HabitToday[]
  tasks: Task[]
  goal: GoalInFocus | null
  daysLeft: number | null
  /** Parte do dia concluída, de 0 a 1. É o nível da maré. */
  level: number
  remaining: number
  xp: number
  rank: Rank
  wind: string | null
  celebration: Celebration | null
  toggleHabit: (id: string) => number
  toggleTask: (id: string) => number
  addTask: (title: string) => void
  completeMilestone: (goal: GoalInFocus) => void
  arriveAtStation: (goal: GoalInFocus, station: number) => void
  dismissWind: () => void
  dismissCelebration: () => void
}

const DayContext = createContext<Day | null>(null)

const now = () => new Date().toISOString()

export function DayProvider({ children }: { children: ReactNode }) {
  const { data: snapshot, isPending } = useSnapshot()

  if (!snapshot) return isPending ? null : <ConnectionNeeded />
  return <LoadedDay snapshot={snapshot}>{children}</LoadedDay>
}

function LoadedDay({ snapshot, children }: { snapshot: Snapshot; children: ReactNode }) {
  const date = useToday()
  const [wind, setWind] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const celebratedOn = useRef<string | null>(null)
  // Ao concluir o último marco, a meta continua na tela até o barco chegar.
  const [arrivingGoalId, setArrivingGoalId] = useState<string | null>(null)

  const { habits, tasks, done, level, remaining, perfect } = summarizeDay(snapshot, date)
  const wasPerfect = useRef(perfect)
  const arriving = snapshot.goals.find((item) => item.id === arrivingGoalId)
  const goal = arriving ? withMilestones(arriving, snapshot) : goalInFocus(snapshot, date)
  const xp = xpOf(snapshot)
  const completedAt = snapshot.days.find((day) => day.date === date)?.completedAt ?? null

  useEffect(() => {
    const reopened = wasPerfect.current && !perfect
    const reachedFull = perfect && !wasPerfect.current
    wasPerfect.current = perfect

    // Fecha ao chegar a 100% e reabre se algo for desmarcado. Fora isso, o dia
    // fica como o usuário deixou, inclusive marcado à mão com menos de 100%.
    if (reopened && completedAt) setDayCompleted(date, null)
    if (perfect && !completedAt) setDayCompleted(date, now())

    // A festa é por chegar a 100%, mesmo que o dia já estivesse marcado à mão.
    if (reachedFull && celebratedOn.current !== date) {
      celebratedOn.current = date
      soundCelebration()
      setCelebration({ title: 'Dia perfeito', detail: `Maré cheia. Mais ${XP.perfectDay} XP.` })
    }
  }, [perfect, completedAt, date])

  const toggleHabit = useCallback(
    (id: string) => {
      const wasDone = snapshot.checks.some((check) => check.habitId === id && check.date === date)
      const path = `/checks/${id}/${date}`
      haptic()

      if (wasDone) {
        commit(
          (current) => ({
            ...current,
            checks: current.checks.filter((check) => !(check.habitId === id && check.date === date)),
          }),
          [{ method: 'DELETE', path }],
        )
        soundUncheck()
        return 0
      }

      commit((current) => ({ ...current, checks: [...current.checks, { habitId: id, date }] }), [
        { method: 'PUT', path },
      ])
      soundCheck(done)
      if (!hasTailwind(id, date)) return XP.habit
      soundWind()
      setWind(pick(FRASES_VENTO))
      return XP.habit + XP.tailwind
    },
    [snapshot, date, done],
  )

  const toggleTask = useCallback(
    (id: string) => {
      const task = snapshot.tasks.find((item) => item.id === id)
      if (!task) return 0

      const next = { ...task, doneAt: task.doneAt ? null : now() }
      commit(
        (current) => ({
          ...current,
          tasks: current.tasks.map((item) => (item.id === id ? next : item)),
        }),
        [{ method: 'PUT', path: `/tasks/${id}`, body: { ...next, editedAt: now() } }],
      )
      haptic()

      if (task.doneAt) {
        soundUncheck()
        return 0
      }
      soundCheck(done)
      return XP.task
    },
    [snapshot, done],
  )

  const addTask = useCallback(
    (title: string) => {
      const task: Task = {
        id: newId(),
        date,
        title,
        goalId: null,
        doneAt: null,
        position: snapshot.tasks.length,
      }
      commit((current) => ({ ...current, tasks: [...current.tasks, task] }), [
        { method: 'PUT', path: `/tasks/${task.id}`, body: { ...task, editedAt: now() } },
      ])
    },
    [snapshot, date],
  )

  const completeMilestone = useCallback((target: GoalInFocus) => {
    haptic()
    if (target.reached + 1 === target.milestones.length) setArrivingGoalId(target.id)
    completeNextMilestone(target)
  }, [])

  const arriveAtStation = useCallback((target: GoalInFocus, station: number) => {
    if (station < target.milestones.length) {
      soundArrival()
      return
    }
    setArrivingGoalId(null)
    soundCelebration()
    setCelebration({ title: 'Meta concluída', detail: `${target.title}. Mais ${XP.goal} XP.` })
  }, [])

  const value: Day = {
    date,
    name: snapshot.user.name,
    hasHabits: snapshot.habits.length > 0,
    habits,
    tasks,
    goal,
    daysLeft: goal?.targetDate ? diffDays(goal.targetDate, date) : null,
    level,
    remaining,
    xp,
    rank: rankFor(xp),
    wind,
    celebration,
    toggleHabit,
    toggleTask,
    addTask,
    completeMilestone,
    arriveAtStation,
    dismissWind: useCallback(() => setWind(null), []),
    dismissCelebration: useCallback(() => setCelebration(null), []),
  }

  return <DayContext value={value}>{children}</DayContext>
}

export function useDay(): Day {
  const day = use(DayContext)
  if (!day) throw new Error('useDay precisa estar dentro de DayProvider')
  return day
}
