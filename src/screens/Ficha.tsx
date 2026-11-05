import { ArrowLeft, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useDay } from '../data/DayProvider'
import { refuseTreinos, usePlanView } from '../data/planGate'
import { useSnapshot } from '../data/store'
import { savePlanExercise, startSession, swapPlanExercises } from '../data/workoutActions'
import type { PlanExercise } from '../data/types'
import { describeWeekdays } from '../lib/habits'
import { newId } from '../lib/ids'
import {
  DEFAULT_REPS,
  DEFAULT_REST_SECONDS,
  DEFAULT_SETS,
  exerciseOf,
  exercisesOf,
  formatLoad,
  musclesOf,
  runningSession,
} from '../lib/workouts'
import { Screen } from '../ui/Screen'
import { ExercisePicker, PlanExerciseSheet, PlanSheet } from '../ui/WorkoutSheets'

export const planDays = ({ weekdays }: { weekdays: number[] }) =>
  weekdays.length > 0 ? describeWeekdays(weekdays) : 'Sem dia fixo'

const describe = ({ sets, reps, loadKg, restSeconds }: PlanExercise) =>
  `${sets} × ${reps}${loadKg ? `, ${formatLoad(loadKg)}` : ''}, ${restSeconds} s de descanso`

export function Ficha() {
  const { id } = useParams()
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const navigate = useNavigate()
  const { treinos } = usePlanView()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [opened, setOpened] = useState<PlanExercise | null>(null)

  const plan = snapshot?.workoutPlans.find((item) => item.id === id)

  if (!snapshot || !plan) {
    return (
      <Screen>
        <BackLink />
        <h1 className="mt-4 font-display text-3xl font-semibold">Ficha não encontrada</h1>
        <p className="mt-2 text-[17px] text-mist">Ela pode ter sido excluída.</p>
      </Screen>
    )
  }

  const exercises = exercisesOf(snapshot, plan.id)
  const running = runningSession(snapshot)
  const muscles = musclesOf(snapshot, plan.id)
  const habit = snapshot.habits.find((item) => item.id === plan.habitId)
  const goal = snapshot.goals.find((item) => item.id === plan.goalId)

  const add = (exerciseRef: string) =>
    savePlanExercise({
      id: newId(),
      planId: plan.id,
      exerciseRef,
      position: Math.max(-1, ...exercises.map((item) => item.position)) + 1,
      sets: DEFAULT_SETS,
      reps: DEFAULT_REPS,
      loadKg: null,
      restSeconds: DEFAULT_REST_SECONDS,
      notes: null,
    })

  return (
    <Screen>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between">
          <BackLink />
          <button
            type="button"
            className="icon-button -mr-2.5"
            aria-label="Editar ficha"
            onClick={() => setEditing(true)}
          >
            <Pencil size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <h1 className="mt-1 font-display text-4xl/[1.08] font-semibold tracking-[-0.02em] wrap-anywhere">
          {plan.title}
        </h1>
        <p className="mt-2 text-[17px] text-mist">
          {planDays(plan)}
          {muscles && ` · ${muscles}`}
        </p>
        {(habit || goal) && (
          <p className="text-[15px] text-mist">
            {[habit && `Marca ${habit.title}`, goal && `Leva a ${goal.title}`].filter(Boolean).join(' · ')}
          </p>
        )}

        <button
          type="button"
          className="action mt-5 min-h-12 w-full"
          disabled={exercises.length === 0 && !running}
          onClick={() => {
            if (!treinos) return refuseTreinos()
            if (!running) startSession(plan.id, date)
            void navigate('/treino')
          }}
        >
          {running ? 'Continuar treino' : 'Começar treino'}
        </button>

        <section aria-labelledby="exercicios" className="mt-8">
          <h2 id="exercicios" className="font-display text-xl font-semibold">
            Exercícios
          </h2>
          {exercises.length > 0 ? (
            <ol className="mt-1 divide-y divide-line">
              {exercises.map((exercise, position) => (
                <li key={exercise.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="min-h-16 min-w-0 flex-1 py-2 text-left"
                    onClick={() => setOpened(exercise)}
                  >
                    <span className="block text-[17px] font-[450] wrap-anywhere">
                      {exerciseOf(exercise.exerciseRef, snapshot.customExercises).name}
                    </span>
                    <span className="block text-[15px] text-mist">{describe(exercise)}</span>
                  </button>
                  <MoveButtons
                    exercises={exercises}
                    position={position}
                    name={exerciseOf(exercise.exerciseRef, snapshot.customExercises).name}
                  />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-[17px] text-mist">
              Escolha os exercícios desta ficha para poder começar.
            </p>
          )}
          <button type="button" className="ghost mt-3 w-full" onClick={() => setAdding(true)}>
            Adicionar exercício
          </button>
        </section>
      </div>

      {editing && <PlanSheet plan={plan} snapshot={snapshot} onClosed={() => setEditing(false)} />}
      {adding && (
        <ExercisePicker snapshot={snapshot} onPick={add} onClosed={() => setAdding(false)} />
      )}
      {opened && (
        <PlanExerciseSheet exercise={opened} snapshot={snapshot} onClosed={() => setOpened(null)} />
      )}
    </Screen>
  )
}

function BackLink() {
  return (
    <Link to="/treinos" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-[15px] text-mist">
      <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
      Treinos
    </Link>
  )
}

type MoveButtonsProps = { exercises: PlanExercise[]; position: number; name: string }

function MoveButtons({ exercises, position, name }: MoveButtonsProps) {
  const current = exercises[position]

  return (
    <span className="-mr-1.5 flex shrink-0">
      <button
        type="button"
        className="icon-button order-handle"
        aria-label={`Subir ${name}`}
        disabled={position === 0}
        onClick={() => swapPlanExercises(current, exercises[position - 1])}
      >
        <ChevronUp size={20} strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        className="icon-button order-handle"
        aria-label={`Descer ${name}`}
        disabled={position === exercises.length - 1}
        onClick={() => swapPlanExercises(current, exercises[position + 1])}
      >
        <ChevronDown size={20} strokeWidth={1.75} aria-hidden />
      </button>
    </span>
  )
}
