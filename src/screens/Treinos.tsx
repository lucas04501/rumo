import { BookOpen, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useDay } from '../data/DayProvider'
import { refusePro, usePlanView } from '../data/planGate'
import { useSnapshot } from '../data/store'
import { startSession } from '../data/workoutActions'
import type { Snapshot, WorkoutPlan, WorkoutSession } from '../data/types'
import { addDays, formatDayShort, formatLongDate, weekOf } from '../lib/dates'
import { buckets, formatMinutes, periodDates } from '../lib/evolution'
import { monthGrid, monthName, monthOf, shiftMonth } from '../lib/month'
import {
  activePlans,
  exerciseOf,
  exercisesOf,
  finishedSessions,
  formatLoad,
  musclesOf,
  personalBests,
  plansOn,
  runningSession,
  setsOf,
  summarize,
  workoutDay,
  workoutsOn,
  type Exercise,
} from '../lib/workouts'
import { Bars } from '../ui/EvolutionCharts'
import { Screen } from '../ui/Screen'
import { ExerciseSheet, PlanSheet, SessionSheet } from '../ui/WorkoutSheets'
import { planDays } from './Ficha'
import { Step, WEEK_LETTERS } from './Mes'

const HEADING = 'font-display text-xl font-semibold'
const FREQUENCY_DAYS = 56
const RECENT_SESSIONS = 8
const BESTS_SHOWN = 6

export function Treinos() {
  const { date: today } = useDay()
  const { data: snapshot } = useSnapshot()
  const [creating, setCreating] = useState(false)
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const { pro } = usePlanView()

  if (!snapshot) return null
  const plans = activePlans(snapshot)
  const finished = finishedSessions(snapshot)

  return (
    <Screen>
      <div className="flex items-center justify-between gap-4 pt-3 lg:pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em]">Treinos</h1>
        <button
          type="button"
          className="action flex items-center gap-1.5"
          onClick={() => (pro ? setCreating(true) : refusePro())}
        >
          <Plus size={18} strokeWidth={2} aria-hidden />
          Nova ficha
        </button>
      </div>

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-16">
        <div>
          <TodayLine snapshot={snapshot} today={today} />

          <section aria-labelledby="fichas" className="mt-6">
            <h2 id="fichas" className={HEADING}>
              Fichas
            </h2>
            {plans.length > 0 ? (
              <ul className="mt-1 divide-y divide-line">
                {plans.map((plan) => (
                  <li key={plan.id}>
                    <PlanRow plan={plan} snapshot={snapshot} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 max-w-[42ch] text-[17px] text-mist">
                Monte uma ficha com os seus exercícios. Terminar o treino marca o hábito ligado, sem
                registro duplicado.
              </p>
            )}
            <Link
              to="/treinos/biblioteca"
              className="flex min-h-13 items-center gap-3 border-t border-line text-[17px]"
            >
              <BookOpen size={20} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
              <span className="min-w-0 flex-1">Biblioteca de exercícios</span>
              <ChevronRight size={18} strokeWidth={1.75} className="text-mist" aria-hidden />
            </Link>
          </section>

          {finished.length > 0 && (
            <section aria-labelledby="historico" className="mt-9">
              <h2 id="historico" className={HEADING}>
                Histórico
              </h2>
              <ul className="mt-1 divide-y divide-line">
                {[...finished]
                  .reverse()
                  .slice(0, RECENT_SESSIONS)
                  .map((item) => (
                    <li key={item.id}>
                      <SessionRow session={item} snapshot={snapshot} onOpen={() => setSession(item)} />
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>

        <div className="mt-9 grid grid-cols-1 gap-9 self-start lg:mt-0">
          <Calendar snapshot={snapshot} today={today} onOpen={setSession} />
          {finished.length > 0 && <Frequency snapshot={snapshot} today={today} />}
          <Bests snapshot={snapshot} onOpen={setExercise} />
        </div>
      </div>

      {creating && <PlanSheet plan={null} snapshot={snapshot} onClosed={() => setCreating(false)} />}
      {session && (
        <SessionSheet session={session} snapshot={snapshot} onClosed={() => setSession(null)} />
      )}
      {exercise && (
        <ExerciseSheet exercise={exercise} snapshot={snapshot} onClosed={() => setExercise(null)} />
      )}
    </Screen>
  )
}

/** Abre direto no que importa hoje: continuar, começar ou nada a fazer. */
function TodayLine({ snapshot, today }: { snapshot: Snapshot; today: string }) {
  const navigate = useNavigate()
  const { pro } = usePlanView()
  const running = runningSession(snapshot)
  const plan = plansOn(snapshot, today)[0]

  // Sem o Pro, o treino em andamento e o de hoje ficam só para ver: não dá para continuar nem começar.
  if (running && pro) {
    const title = snapshot.workoutPlans.find((item) => item.id === running.planId)?.title
    return (
      <div className="panel-line">
        <p className="min-w-0 text-[17px]">
          <span className="text-mist">Em andamento: </span>
          {title}
        </p>
        <Link to="/treino" className="action inline-grid shrink-0 place-items-center">
          Continuar
        </Link>
      </div>
    )
  }

  if (workoutsOn(snapshot)(today) > 0) {
    return <p className="text-[17px] text-mist">Treino de hoje feito.</p>
  }
  if (activePlans(snapshot).length === 0) return null
  if (!plan) return <p className="text-[17px] text-mist">Hoje é dia de recuperação.</p>

  const ready = pro && exercisesOf(snapshot, plan.id).length > 0

  return (
    <div className="panel-line">
      <p className="min-w-0 text-[17px]">
        <span className="text-mist">Hoje: </span>
        {plan.title}
      </p>
      {ready && (
        <button
          type="button"
          className="action shrink-0"
          onClick={() => {
            startSession(plan.id, today)
            void navigate('/treino')
          }}
        >
          Começar
        </button>
      )}
    </div>
  )
}

function PlanRow({ plan, snapshot }: { plan: WorkoutPlan; snapshot: Snapshot }) {
  const muscles = musclesOf(snapshot, plan.id)

  return (
    <Link to={`/treinos/${plan.id}`} className="flex min-h-16 items-center gap-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-[450] wrap-anywhere">{plan.title}</span>
        <span className="block truncate text-[15px] text-mist">
          {planDays(plan)}
          {muscles && ` · ${muscles}`}
        </span>
      </span>
      <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
    </Link>
  )
}

type SessionRowProps = { session: WorkoutSession; snapshot: Snapshot; onOpen: () => void }

function SessionRow({ session, snapshot, onOpen }: SessionRowProps) {
  const sets = setsOf(snapshot, session.id)
  const { minutes } = summarize(session, sets, '')
  const title = snapshot.workoutPlans.find((plan) => plan.id === session.planId)?.title ?? 'Treino'

  return (
    <button type="button" className="min-h-16 w-full py-2 text-left" onClick={onOpen}>
      <span className="block text-[17px] font-[450] wrap-anywhere">{title}</span>
      <span className="block text-[15px] text-mist">
        {formatDayShort(session.date)}, {sets.length} {sets.length === 1 ? 'série' : 'séries'},{' '}
        {formatMinutes(minutes)}
      </span>
    </button>
  )
}

type CalendarProps = {
  snapshot: Snapshot
  today: string
  onOpen: (session: WorkoutSession) => void
}

const DAY_LABELS = { done: 'treino feito', planned: 'treino planejado', rest: 'descanso' }

function Calendar({ snapshot, today, onOpen }: CalendarProps) {
  const [month, setMonth] = useState(() => monthOf(today))
  const name = monthName(month)

  return (
    <section aria-labelledby="calendario-de-treino">
      <h2 id="calendario-de-treino" className="sr-only">
        Calendário de treino
      </h2>
      <div className="-mt-4">
        <Step
          label={`${name[0].toUpperCase()}${name.slice(1)} de ${month.slice(0, 4)}`}
          previous="Mês anterior"
          next="Próximo mês"
          onPrevious={() => setMonth(shiftMonth(month, -1))}
          onNext={() => setMonth(shiftMonth(month, 1))}
        />
      </div>
      <div className="cal-grid mt-2" aria-hidden>
        {WEEK_LETTERS.map((letter, day) => (
          <span key={day} className="text-center text-sm text-mist">
            {letter}
          </span>
        ))}
      </div>
      <div className="cal-grid mt-1.5">
        {monthGrid(month).map((date, position) => {
          if (!date) return <span key={`vazio-${position}`} />

          const kind = workoutDay(snapshot, date, today)
          const day = Number(date.slice(8))
          const label = `${formatLongDate(date)}, ${DAY_LABELS[kind]}`
          const session = finishedSessions(snapshot).find((item) => item.date === date)

          return session ? (
            <button
              key={date}
              type="button"
              className="cal-day"
              data-done
              data-today={date === today}
              aria-label={label}
              onClick={() => onOpen(session)}
            >
              <span className="cal-number">{day}</span>
            </button>
          ) : (
            <span
              key={date}
              className="cal-day"
              data-planned={kind === 'planned'}
              data-today={date === today}
              aria-label={label}
              role="img"
            >
              <span className="cal-number">{day}</span>
            </span>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-4 text-sm text-mist">
        <span className="flex items-center gap-1.5">
          <span className="cal-key" data-kind="done" aria-hidden /> Feito
        </span>
        <span className="flex items-center gap-1.5">
          <span className="cal-key" data-kind="planned" aria-hidden /> Planejado
        </span>
        <span>Vazio é recuperação</span>
      </p>
    </section>
  )
}

function Frequency({ snapshot, today }: { snapshot: Snapshot; today: string }) {
  const items = useMemo(
    () =>
      buckets(periodDates(addDays(today, 1), FREQUENCY_DAYS), workoutsOn(snapshot), (value) =>
        value === 1 ? '1 treino' : `${value} treinos`,
      ),
    [snapshot, today],
  )
  const count = workoutsOn(snapshot)
  const thisWeek = weekOf(today).reduce((sum, date) => sum + count(date), 0)

  return (
    <section aria-labelledby="frequencia">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="frequencia" className={HEADING}>
          Frequência
        </h2>
        <p className="text-[15px] text-mist">
          {thisWeek} {thisWeek === 1 ? 'treino' : 'treinos'} nesta semana
        </p>
      </div>
      <div className="mt-1">
        <Bars items={items} label="Treinos por semana" color="workout" />
      </div>
    </section>
  )
}

function Bests({ snapshot, onOpen }: { snapshot: Snapshot; onOpen: (exercise: Exercise) => void }) {
  const bests = personalBests(snapshot).slice(0, BESTS_SHOWN)
  if (bests.length === 0) return null

  return (
    <section aria-labelledby="maiores-cargas">
      <h2 id="maiores-cargas" className={HEADING}>
        Maiores cargas
      </h2>
      <ul className="mt-1 divide-y divide-line">
        {bests.map(({ ref, value, date }) => {
          const exercise = exerciseOf(ref, snapshot.customExercises)
          return (
            <li key={ref}>
              <button
                type="button"
                className="flex min-h-13 w-full items-center gap-3 py-2 text-left"
                onClick={() => onOpen(exercise)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-[450] wrap-anywhere">{exercise.name}</span>
                  <span className="block text-[15px] text-mist">{formatDayShort(date)}</span>
                </span>
                <span className="shrink-0 text-[17px] font-semibold">{formatLoad(value)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
