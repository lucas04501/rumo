import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { FRASES_VENTO, pick } from '../content/frases'
import { placeOn, type Column } from '../lib/board'
import { diffDays } from '../lib/dates'
import { formatMinutes } from '../lib/evolution'
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
import { exerciseOf, formatLoad, recordsOf, setsOf, summarize } from '../lib/workouts'
import { XP, hasTailwind, rankFor, type Rank } from '../lib/xp'
import { ConnectionNeeded } from '../ui/ConnectionNeeded'
import { setDayCompleted } from './dayActions'
import { completeNextMilestone } from './goalActions'
import { setCheck } from './habitActions'
import { commit, useSnapshot } from './store'
import { saveTask } from './taskActions'
import type { Snapshot, Task, WaterLog, WorkoutSession } from './types'
import { offerUndo } from './undo'
import { deleteWaterLog, hideWaterLog, restoreWaterLog, saveWaterLog } from './waterActions'
import { formatWater, totalOn, waterSettingsOf } from '../lib/water'
import { useAchievements } from './useAchievements'
import { useRankUp } from './useRankUp'
import { useToday } from './useToday'
import { saveSession } from './workoutActions'

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
  /** Fecha o treino e marca o hábito ligado. O XP sai do hábito e dos recordes, nunca do treino em si. */
  finishWorkout: (session: WorkoutSession) => void
  /** Registra um copo. Bater a meta marca o hábito ligado: o copo em si não dá XP. */
  drinkWater: (amountMl: number) => void
  /** Tira o copo com Desfazer. Se o dia cair abaixo da meta, o hábito desmarca. */
  removeWater: (log: WaterLog) => void
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

  const finishWorkout = useCallback(
    (session: WorkoutSession) => {
      const finished = { ...session, finishedAt: now() }
      const sets = setsOf(snapshot, session.id)
      const { minutes } = summarize(finished, sets, '')
      const habitId = snapshot.workoutPlans.find((plan) => plan.id === session.planId)?.habitId
      const checked = snapshot.checks.some(
        (check) => check.habitId === habitId && check.date === session.date,
      )
      const records = recordsOf({
        ...snapshot,
        workoutSessions: snapshot.workoutSessions.map((item) =>
          item.id === session.id ? finished : item,
        ),
      }).filter((record) => record.sessionId === session.id)

      saveSession(finished)
      if (habitId && !checked) setCheck(habitId, session.date, true)
      haptic()

      addReward({
        title: 'Treino concluído',
        detail: `${sets.length} ${sets.length === 1 ? 'série' : 'séries'}, ${formatMinutes(minutes)}.`,
        sound: soundArrival,
      })
      for (const { exerciseRef, loadKg } of records) {
        const { name } = exerciseOf(exerciseRef, snapshot.customExercises)
        addReward({
          title: `Recorde: ${name}`,
          detail: `${formatLoad(loadKg)}. Mais ${XP.record} XP.`,
          sound: soundArrival,
        })
      }
    },
    [snapshot, addReward],
  )

  const waterHabitId = useCallback(() => {
    const settings = waterSettingsOf(snapshot)
    const habit = snapshot.habits.find((item) => item.id === settings?.habitId && !item.archivedAt)
    return habit?.id ?? null
  }, [snapshot])

  const drinkWater = useCallback(
    (amountMl: number) => {
      const settings = waterSettingsOf(snapshot)
      if (!settings) return
      const before = totalOn(snapshot.waterLogs, date)
      const after = before + amountMl
      const glasses = snapshot.waterLogs.filter((log) => log.date === date).length

      saveWaterLog({ id: newId(), date, amountMl, loggedAt: now() })
      haptic()

      if (before >= settings.goalMl || after < settings.goalMl) {
        // Discreto: a nota sobe a cada copo do dia, e a festa fica para a meta.
        soundCheck(glasses)
        return
      }

      const habitId = waterHabitId()
      const checked = snapshot.checks.some((check) => check.habitId === habitId && check.date === date)
      if (habitId && !checked) setCheck(habitId, date, true)
      addReward({
        title: 'Meta de água batida',
        detail: habitId && !checked ? `${formatWater(after)} hoje. Mais ${XP.habit} XP.` : `${formatWater(after)} hoje.`,
        sound: soundArrival,
      })
    },
    [snapshot, date, waterHabitId, addReward],
  )

  const removeWater = useCallback(
    (log: WaterLog) => {
      const settings = waterSettingsOf(snapshot)
      const before = totalOn(snapshot.waterLogs, log.date)
      const habitId = waterHabitId()
      const wasChecked = snapshot.checks.some(
        (check) => check.habitId === habitId && check.date === log.date,
      )
      const drops = !!settings && before >= settings.goalMl && before - log.amountMl < settings.goalMl
      const uncheck = drops && !!habitId && wasChecked

      hideWaterLog(log)
      if (uncheck) setCheck(habitId, log.date, false)
      soundUncheck()

      offerUndo({
        message: `${formatWater(log.amountMl)} tirados`,
        undo: () => {
          restoreWaterLog(log)
          if (uncheck) setCheck(habitId, log.date, true)
        },
        expire: () => deleteWaterLog(log),
      })
    },
    [snapshot, waterHabitId],
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
    finishWorkout,
    drinkWater,
    removeWater,
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
