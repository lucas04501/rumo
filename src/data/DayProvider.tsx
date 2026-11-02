import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FRASES_VENTO, pick } from '../content/frases'
import { diffDays, hoje } from '../lib/dates'
import {
  haptic,
  soundArrival,
  soundCelebration,
  soundCheck,
  soundUncheck,
  soundWind,
} from '../lib/feedback'
import { currentStreak } from '../lib/streaks'
import { XP, rankFor, totalXp, type Rank } from '../lib/xp'
import { createDemo, historyXp, isWindy, type Goal, type Habit, type Task } from './demo'

export type HabitToday = Habit & { done: boolean; streak: number; anchorUsed: boolean }

export type Celebration = { title: string; detail: string }

type Day = {
  date: string
  habits: HabitToday[]
  tasks: Task[]
  goal: Goal
  daysLeft: number
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

export function DayProvider({ children }: { children: ReactNode }) {
  const [date] = useState(() => hoje())
  const [seed] = useState(() => createDemo(date))
  const [checked, setChecked] = useState(seed.checkedToday)
  const [tasks, setTasks] = useState(seed.tasks)
  const [goal, setGoal] = useState(seed.goal)
  const [wind, setWind] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const celebratedToday = useRef(false)

  const doneToday = checked.size + tasks.filter((task) => task.done).length
  const total = seed.habits.length + tasks.length
  const level = total === 0 ? 0 : doneToday / total
  const perfect = total > 0 && doneToday === total

  useEffect(() => {
    if (!perfect || celebratedToday.current) return
    celebratedToday.current = true
    soundCelebration()
    setCelebration({ title: 'Dia perfeito', detail: `Maré cheia. Mais ${XP.perfectDay} XP.` })
  }, [perfect])

  const habits = useMemo(
    () =>
      seed.habits.map((habit) => {
        const done = checked.has(habit.id)
        const dates = new Set(seed.history.get(habit.id))
        if (done) dates.add(date)
        const { days, anchorUsed } = currentStreak(habit, dates, date)
        return { ...habit, done, streak: days, anchorUsed }
      }),
    [seed, checked, date],
  )

  const xp = useMemo(() => {
    const past = historyXp(seed.history, date)
    return totalXp({
      ...past,
      checks: [
        ...past.checks,
        ...[...checked].map((habitId) => ({
          habitId,
          date,
          tailwind: isWindy(habitId, date, date),
        })),
      ],
      tasksDone: past.tasksDone + tasks.filter((task) => task.done).length,
      perfectDays: past.perfectDays + (perfect ? 1 : 0),
      milestonesDone: goal.reached,
      goalsDone: goal.reached === goal.milestones.length ? 1 : 0,
    })
  }, [seed, checked, tasks, goal, date, perfect])

  const toggleHabit = useCallback(
    (id: string) => {
      const wasDone = checked.has(id)
      const next = new Set(checked)
      if (wasDone) next.delete(id)
      else next.add(id)
      setChecked(next)
      haptic()

      if (wasDone) {
        soundUncheck()
        return 0
      }

      soundCheck(doneToday)
      if (!isWindy(id, date, date)) return XP.habit
      soundWind()
      setWind(pick(FRASES_VENTO))
      return XP.habit + XP.tailwind
    },
    [checked, date, doneToday],
  )

  const toggleTask = useCallback(
    (id: string) => {
      const task = tasks.find((item) => item.id === id)
      if (!task) return 0
      setTasks(tasks.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
      haptic()
      if (task.done) {
        soundUncheck()
        return 0
      }
      soundCheck(doneToday)
      return XP.task
    },
    [tasks, doneToday],
  )

  const addTask = useCallback((title: string) => {
    setTasks((current) => [...current, { id: `tarefa-${Date.now()}`, title, done: false }])
  }, [])

  const completeMilestone = useCallback(() => {
    haptic()
    setGoal((current) => ({
      ...current,
      reached: Math.min(current.reached + 1, current.milestones.length),
    }))
  }, [])

  const arriveAtStation = useCallback(
    (station: number) => {
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
    habits,
    tasks,
    goal,
    daysLeft: diffDays(goal.targetDate, date),
    level,
    remaining: total - doneToday,
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
