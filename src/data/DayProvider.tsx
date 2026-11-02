import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { FRASES_VENTO, pick } from '../content/frases'
import { placeOn, type Column } from '../lib/board'
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
import { saveTask } from './taskActions'
import type { Snapshot, Task } from './types'
import { useAchievements } from './useAchievements'
import { useRankUp } from './useRankUp'
import { useToday } from './useToday'

export type { HabitToday } from '../lib/progress'

export type Celebration = { title: string; detail: string }

export type Reward = {
  id: string
  title: string
  detail: string
  isRank?: boolean
  isMedal?: boolean
  /** Toca quando o aviso aparece, e não quando entra na fila. */
  sound?: () => void
}

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
  reward: Reward | null
  celebration: Celebration | null
  toggleHabit: (id: string) => number
  toggleTask: (task: Task) => number
  /** Move no quadro e devolve o XP ganho, como o check. */
  moveCard: (task: Task, column: Column) => number
  completeMilestone: (goal: GoalInFocus) => void
  arriveAtStation: (goal: GoalInFocus, station: number) => void
  dismissReward: () => void
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
  const [rewards, setRewards] = useState<Reward[]>([])
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const celebratedOn = useRef<string | null>(null)
  // Ao concluir o último marco, a meta continua na tela até o barco chegar.
  const [arrivingGoalId, setArrivingGoalId] = useState<string | null>(null)

  const { habits, tasks, done, level, remaining, perfect } = summarizeDay(snapshot, date)
  const wasPerfect = useRef(perfect)
  const arriving = snapshot.goals.find((item) => item.id === arrivingGoalId)
  const goal = arriving ? withMilestones(arriving, snapshot) : goalInFocus(snapshot, date)
  const xp = xpOf(snapshot)
  const rank = rankFor(xp)
  const completedAt = snapshot.days.find((day) => day.date === date)?.completedAt ?? null

  const addReward = useCallback((reward: Omit<Reward, 'id'>) => {
    setRewards((current) => [...current, { ...reward, id: newId() }])
  }, [])

  useRankUp(snapshot, rank, ({ name, next }) =>
    addReward({
      title: `Nova patente: ${name}`,
      detail: next ? `Próxima parada: ${next}.` : 'Não há mar acima deste.',
      isRank: true,
      sound: soundArrival,
    }),
  )

  useAchievements(snapshot, date, ({ title, detail }) =>
    addReward({ title: `Conquista: ${title}`, detail, isMedal: true, sound: soundArrival }),
  )

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
      addReward({ title: `Vento a favor! Mais ${XP.tailwind} XP`, detail: pick(FRASES_VENTO) })
      return XP.habit + XP.tailwind
    },
    [snapshot, date, done, addReward],
  )

  const toggleTask = useCallback(
    (task: Task) => {
      saveTask({ ...task, doneAt: task.doneAt ? null : now() })
      haptic()

      if (task.doneAt) {
        soundUncheck()
        return 0
      }
      soundCheck(done)
      return XP.task
    },
    [done],
  )

  const moveCard = useCallback(
    (task: Task, column: Column) => {
      const moved = placeOn(task, column, now())
      if (moved === task) return 0
      saveTask(moved)
      haptic()

      if (moved.doneAt && !task.doneAt) {
        soundCheck(done)
        return XP.task
      }
      if (task.doneAt) soundUncheck()
      return 0
    },
    [done],
  )

  const completeMilestone = useCallback((target: GoalInFocus) => {
    haptic()
    if (target.reached + 1 === target.milestones.length) setArrivingGoalId(target.id)
    completeNextMilestone(target)
  }, [])

  const arriveAtStation = useCallback(
    (target: GoalInFocus, station: number) => {
      if (station < target.milestones.length) {
        soundArrival()
        addReward({
          title: `Marco alcançado. Mais ${XP.milestone} XP`,
          detail: target.milestones[station - 1].title,
        })
        return
      }
      setArrivingGoalId(null)
      soundCelebration()
      setCelebration({ title: 'Meta concluída', detail: `${target.title}. Mais ${XP.goal} XP.` })
    },
    [addReward],
  )

  // Recompensa pequena espera a onda e a chegada do barco, que cobririam o aviso.
  const reward = celebration || arrivingGoalId ? null : (rewards[0] ?? null)

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
    rank,
    reward,
    celebration,
    toggleHabit,
    toggleTask,
    moveCard,
    completeMilestone,
    arriveAtStation,
    dismissReward: useCallback(() => setRewards((current) => current.slice(1)), []),
    dismissCelebration: useCallback(() => setCelebration(null), []),
  }

  return <DayContext value={value}>{children}</DayContext>
}

export function useDay(): Day {
  const day = use(DayContext)
  if (!day) throw new Error('useDay precisa estar dentro de DayProvider')
  return day
}
