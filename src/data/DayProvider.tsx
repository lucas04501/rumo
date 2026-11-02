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
  xpOf,
  type GoalInFocus,
  type HabitToday,
} from '../lib/progress'
import { XP, hasTailwind, rankFor, type Rank } from '../lib/xp'
import { ConnectionNeeded } from '../ui/ConnectionNeeded'
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
  completeMilestone: () => void
  arriveAtStation: (station: number) => void
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

  const { habits, tasks, done, level, remaining, perfect } = summarizeDay(snapshot, date)
  const goal = goalInFocus(snapshot, date)
  const xp = xpOf(snapshot)
  const completedAt = snapshot.days.find((day) => day.date === date)?.completedAt ?? null

  useEffect(() => {
    if (perfect === Boolean(completedAt)) return

    // O dia acompanha o progresso: fecha ao chegar a 100% e reabre se algo for desmarcado.
    const value = perfect ? now() : null
    commit(
      (current) => ({
        ...current,
        days: [
          ...current.days.filter((day) => day.date !== date),
          {
            date,
            completedAt: value,
            note: current.days.find((day) => day.date === date)?.note ?? null,
          },
        ],
      }),
      [{ method: 'PUT', path: `/days/${date}`, body: { completedAt: value, editedAt: now() } }],
    )

    if (perfect && celebratedOn.current !== date) {
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
      const task: Task = { id: newId(), date, title, doneAt: null, position: snapshot.tasks.length }
      commit((current) => ({ ...current, tasks: [...current.tasks, task] }), [
        { method: 'PUT', path: `/tasks/${task.id}`, body: { ...task, editedAt: now() } },
      ])
    },
    [snapshot, date],
  )

  const completeMilestone = useCallback(() => {
    if (!goal) return
    const next = goal.milestones[goal.reached]
    if (!next) return

    const doneAt = now()
    const finished = goal.reached + 1 === goal.milestones.length
    const finishedGoal = { ...goal, status: 'done' as const, doneAt }

    haptic()
    commit(
      (current) => ({
        ...current,
        milestones: current.milestones.map((item) =>
          item.id === next.id ? { ...item, doneAt } : item,
        ),
        goals: finished
          ? current.goals.map((item) => (item.id === goal.id ? finishedGoal : item))
          : current.goals,
      }),
      [
        {
          method: 'PUT',
          path: `/milestones/${next.id}`,
          body: { ...next, doneAt, editedAt: doneAt },
        },
        ...(finished
          ? [
              {
                method: 'PUT' as const,
                path: `/goals/${goal.id}`,
                body: { ...finishedGoal, editedAt: doneAt },
              },
            ]
          : []),
      ],
    )
  }, [goal])

  const arriveAtStation = useCallback(
    (station: number) => {
      if (!goal) return
      if (station < goal.milestones.length) {
        soundArrival()
        return
      }
      soundCelebration()
      setCelebration({ title: 'Meta concluída', detail: `${goal.title}. Mais ${XP.goal} XP.` })
    },
    [goal],
  )

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
