import { Anchor, ChevronRight, Columns3, Plus, Timer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useDay, type HabitToday } from '../data/DayProvider'
import { useFocusTimer } from '../data/focusTimer'
import { useSnapshot } from '../data/store'
import { bringToToday } from '../data/taskActions'
import { useNow } from '../data/useNow'
import { formatLongDate, weekdayOf, weekOf } from '../lib/dates'
import { buckets, focusMinutesOn, formatMinutes, periodDates, periodStats } from '../lib/evolution'
import { formatClock, isOver, leftMs } from '../lib/focus'
import { deadlineLabel } from '../lib/goals'
import { dayProgress, indexSnapshot, type SnapshotIndex } from '../lib/progress'
import { clockOf, currentStep, nextStep, stepsOn } from '../lib/routine'
import { isStreakMark } from '../lib/streaks'
import { overdueTasks } from '../lib/tasks'
import { plansOn, runningSession, workoutsOn } from '../lib/workouts'
import { XP } from '../lib/xp'
import { Bars } from '../ui/EvolutionCharts'
import { iconFor } from '../ui/habitIcons'
import { ItemRow } from '../ui/ItemRow'
import { QuickChips, useQuickAdd } from '../ui/QuickAdd'
import { Quote } from '../ui/Quote'
import { Screen } from '../ui/Screen'
import { SoundToggle } from '../ui/SoundToggle'
import { TaskRow } from '../ui/TaskRow'
import { Ticker } from '../ui/Ticker'
import { Route } from '../voyage/Route'
import { TideBand } from '../voyage/TideBand'

export function Hoje() {
  return (
    <Screen wide>
      <div className="relative">
        <TopBar />
        <Greeting />
      </div>
      <DayTide />
      <Quote />
      <div className="mt-6 grid grid-cols-1 gap-9 lg:grid-cols-2 lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="panel grid grid-cols-1 gap-6">
          <div>
            <WorkoutShortcut />
            <RoutineShortcut />
          </div>
          <Habits />
        </div>
        <div className="panel">
          <Tasks />
        </div>
        <div className="grid grid-cols-1 gap-9 lg:col-span-2 lg:grid-cols-2 lg:items-start lg:gap-5 xl:col-span-1 xl:grid-cols-1">
          <div className="panel">
            <FocusGoal />
          </div>
          <div className="panel">
            <Week />
          </div>
        </div>
      </div>
    </Screen>
  )
}

function TopBar() {
  const { xp, rank, reward } = useDay()
  const lastXp = useRef(xp)
  const [gains, setGains] = useState(0)

  useEffect(() => {
    if (xp > lastXp.current) setGains((count) => count + 1)
    lastXp.current = xp
  }, [xp])

  return (
    <header className="flex items-start justify-between lg:absolute lg:top-0 lg:right-0">
      <p className="font-display text-[22px] font-semibold lg:hidden">Rumo</p>
      <div className="flex items-start">
        <div className="text-right">
          <p className="text-sm leading-tight whitespace-nowrap">
            <span
              className={`transition-colors duration-500 ${reward?.isRank ? 'text-sun' : 'text-mist'}`}
            >
              {rank.name} ·{' '}
            </span>
            <span className="font-semibold">
              <Ticker value={xp} /> XP
            </span>
          </p>
          <div
            role="progressbar"
            aria-label="Avanço até a próxima patente"
            aria-valuenow={Math.round(rank.progress * 100)}
            className="relative mt-1.5 ml-auto h-[3px] w-28 overflow-hidden rounded-full bg-line-strong"
          >
            <div
              className="h-full origin-left rounded-full bg-sun transition-transform duration-500 ease-out"
              style={{ transform: `scaleX(${rank.progress})` }}
            />
            {gains > 0 && <span key={gains} className="rank-glint" />}
          </div>
        </div>
        <SoundToggle />
      </div>
    </header>
  )
}

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function tideSentence(remaining: number, isEmpty: boolean): string {
  if (isEmpty) return 'Nada programado para hoje.'
  if (remaining === 0) return 'Maré cheia.'
  if (remaining === 1) return 'Falta 1 para a maré cheia.'
  return `Faltam ${remaining} para a maré cheia.`
}

function Greeting() {
  const { date, name } = useDay()
  const firstName = name.trim().split(/\s+/)[0]

  return (
    <div className="pt-6 lg:pt-0">
      <h1 className="font-display text-[38px]/[1.05] font-semibold tracking-[-0.025em] lg:text-[44px]">
        {greetingFor(new Date().getHours())}, {firstName}.
      </h1>
      <p className="mt-2 text-[17px]/snug text-mist">{formatLongDate(date)}</p>
    </div>
  )
}

function DayTide() {
  const { habits, tasks, level, remaining } = useDay()
  const total = habits.length + tasks.length

  return (
    <div className="mt-5">
      <TideBand level={level}>
        <p className="min-w-0 font-display text-xl/tight font-semibold">
          {tideSentence(remaining, total === 0)}
        </p>
        {total > 0 && (
          <p className="shrink-0 text-[15px] font-medium">
            {total - remaining} de {total}
          </p>
        )}
      </TideBand>
    </div>
  )
}

function FocusGoal() {
  const { goal, daysLeft, completeMilestone, arriveAtStation } = useDay()

  if (!goal || goal.milestones.length === 0) {
    return (
      <section aria-label="Metas">
        <p className="text-[17px] text-mist">Sem destino por enquanto.</p>
        <Link to="/metas" className="ghost mt-2 inline-grid place-items-center">
          Traçar uma rota
        </Link>
      </section>
    )
  }

  const milestones = goal.milestones.length
  const next = goal.milestones[goal.reached]?.title

  return (
    <section aria-labelledby="meta-em-foco">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="meta-em-foco" className="min-w-0 font-display text-xl font-semibold">
          <Link to={`/metas/${goal.id}`}>{goal.title}</Link>
        </h2>
        <p className="shrink-0 text-[15px] text-mist">{deadlineLabel(daysLeft, !next)}</p>
      </div>

      <div className="mt-4">
        <Route
          key={goal.id}
          milestones={milestones}
          reached={goal.reached}
          label={`Rota da meta: ${goal.reached} de ${milestones} marcos concluídos`}
          onArrive={(station) => arriveAtStation(goal, station)}
        />
      </div>

      <div className="mt-3 flex min-h-11 items-center justify-between gap-4">
        {next ? (
          <>
            <p className="min-w-0 text-[15px] text-mist">
              Próximo marco: <span className="text-foam">{next}</span>
            </p>
            <button type="button" className="action" onClick={() => completeMilestone(goal)}>
              Concluir
            </button>
          </>
        ) : (
          <p className="text-[15px] text-foam">Você chegou. Todos os marcos concluídos.</p>
        )}
      </div>
    </section>
  )
}

function Habits() {
  const { habits, hasHabits } = useDay()
  const done = habits.filter((habit) => habit.done).length

  return (
    <section aria-labelledby="habitos-de-hoje">
      <div className="flex items-baseline justify-between">
        <h2 id="habitos-de-hoje" className="font-display text-xl font-semibold">
          Hábitos de hoje
        </h2>
        {habits.length > 0 && (
          <p className="text-[15px] text-mist">
            {done} de {habits.length}
          </p>
        )}
      </div>

      {habits.length > 0 ? (
        <ul className="mt-2 divide-y divide-line">
          {habits.map((habit) => (
            <li key={habit.id}>
              <HabitRow habit={habit} />
            </li>
          ))}
        </ul>
      ) : hasHabits ? (
        <p className="mt-2 text-[17px] text-mist">Nenhum hábito programado para hoje.</p>
      ) : (
        <div className="mt-2">
          <p className="text-[17px] text-mist">Crie um hábito uma vez e ele volta todo dia.</p>
          <Link to="/habitos" className="action mt-3 inline-grid place-items-center">
            Criar primeiro hábito
          </Link>
        </div>
      )}
    </section>
  )
}

function HabitRow({ habit }: { habit: HabitToday }) {
  const { toggleHabit } = useDay()
  const [gains, setGains] = useState(0)
  const Icon = iconFor(habit.icon)
  const atMark = habit.done && isStreakMark(habit.streak)

  return (
    <ItemRow
      title={habit.title}
      done={habit.done}
      onToggle={() => {
        const xp = toggleHabit(habit.id)
        if (xp > 0) setGains((count) => count + 1)
        return xp
      }}
      leading={<Icon size={19} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />}
      trailing={
        <span
          className={`flex shrink-0 items-center gap-1 text-[15px] ${atMark ? 'text-sun' : 'text-mist'}`}
        >
          {habit.anchorUsed && (
            <Anchor size={14} strokeWidth={1.75} aria-label="Âncora em uso: uma falta perdoada" />
          )}
          <span key={gains} className={gains > 0 ? 'streak-pop' : undefined}>
            {habit.streak} {habit.streak === 1 ? 'dia' : 'dias'}
          </span>
        </span>
      }
    />
  )
}

function FocusShortcut() {
  const timer = useFocusTimer()
  const now = useNow(timer?.endsAt ? 1000 : null)

  return (
    <Link to="/foco" className="flex min-h-11 items-center gap-1.5 text-[15px] text-mist">
      <Timer size={17} strokeWidth={1.75} aria-hidden />
      {!timer ? 'Foco' : isOver(timer) ? 'Bloco concluído' : formatClock(leftMs(timer, now))}
    </Link>
  )
}

function WorkoutShortcut() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  if (!snapshot) return null

  const running = runningSession(snapshot)
  const plan = plansOn(snapshot, date)[0]
  const done = workoutsOn(snapshot)(date) > 0
  if (!running && (!plan || done)) return null

  const title = running
    ? snapshot.workoutPlans.find((item) => item.id === running.planId)?.title
    : plan.title

  return (
    <Link
      to={running ? '/treino' : `/treinos/${plan.id}`}
      className="flex min-h-11 items-center justify-between gap-3 text-[15px]"
    >
      <span className="min-w-0 truncate">
        <span className="text-mist">{running ? 'Treino em andamento: ' : 'Treino de hoje: '}</span>
        {title}
      </span>
      <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
    </Link>
  )
}

function RoutineShortcut() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const now = useNow(60_000)
  if (!snapshot) return null

  const steps = stepsOn(snapshot.routineSteps, weekdayOf(date))
  if (steps.length === 0) return null

  const clock = clockOf(now)
  const current = currentStep(steps, clock)
  const next = nextStep(steps, clock)

  return (
    <Link to="/rotina" className="flex min-h-11 items-center justify-between gap-3 text-[15px]">
      <span className="min-w-0">
        {current && (
          <span className="block truncate">
            <span className="text-mist">Agora: </span>
            {current.title}
          </span>
        )}
        {next && (
          <span className="block truncate text-mist">
            {next.time}: {next.title}
          </span>
        )}
      </span>
      <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
    </Link>
  )
}

const percentOn = (index: SnapshotIndex) => (date: string) =>
  Math.round(dayProgress(index, date).level * 100)

/** A semana de relance. A análise do período fica na Evolução, e aqui só o que orienta o dia. */
function Week() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const view = useMemo(() => {
    if (!snapshot) return null
    const index = indexSnapshot(snapshot)
    const week = weekOf(date)
    const focus = focusMinutesOn(snapshot)
    return {
      score: periodStats(snapshot, index, periodDates(date, 7)).score,
      bars: buckets(week, percentOn(index), (value) => `${value}% do dia`),
      focusMinutes: week.reduce((sum, day) => sum + focus(day), 0),
      overdue: overdueTasks(snapshot.tasks, date).length,
    }
  }, [snapshot, date])

  if (!view) return null
  const { score, bars, focusMinutes, overdue } = view

  return (
    <section aria-labelledby="semana">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="semana" className="font-display text-xl font-semibold">
          Semana
        </h2>
        <Link to="/evolucao" className="text-[15px] text-mist underline underline-offset-4">
          Evolução
        </Link>
      </div>
      <div className="mt-1">
        <Bars items={bars} label="Parte de cada dia concluída" color="tide" selected={date} />
      </div>
      <dl className="mt-2 divide-y divide-line">
        <WeekFigure label="Últimos 7 dias" value={score === null ? '—' : `${score}% do combinado`} />
        <WeekFigure label="Foco na semana" value={formatMinutes(focusMinutes)} />
        {overdue > 0 && <WeekFigure label="Ficaram para trás" value={String(overdue)} />}
      </dl>
    </section>
  )
}

function WeekFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-baseline justify-between gap-4 py-2 text-[15px]">
      <dt className="text-mist">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

function Overdue() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const overdue = snapshot ? overdueTasks(snapshot.tasks, date) : []

  if (overdue.length === 0) return null

  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-line py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[15px]">
          {overdue.length === 1 ? '1 ficou para trás' : `${overdue.length} ficaram para trás`}
        </p>
        <p className="truncate text-[15px] text-mist">
          {overdue.map((task) => task.title).join(', ')}
        </p>
      </div>
      <button type="button" className="ghost" onClick={() => bringToToday(overdue, date)}>
        Trazer
      </button>
    </div>
  )
}

function Tasks() {
  const { tasks } = useDay()
  const { title, setTitle, labels, ignore, save } = useQuickAdd()
  const [focused, setFocused] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save()
  }

  return (
    <section aria-labelledby="tarefas-de-hoje">
      <div className="flex items-center justify-between gap-4">
        <h2 id="tarefas-de-hoje" className="font-display text-xl font-semibold">
          Tarefas
        </h2>
        <div className="flex items-center gap-4">
          <Link to="/quadro" className="flex min-h-11 items-center gap-1.5 text-[15px] text-mist">
            <Columns3 size={17} strokeWidth={1.75} aria-hidden />
            Quadro
          </Link>
          <FocusShortcut />
        </div>
      </div>
      <Overdue />
      <ul className="mt-1 divide-y divide-line">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskRow task={task} />
          </li>
        ))}
        <li>
          <form onSubmit={submit}>
            <div className="flex min-h-14 items-center gap-3">
              <Plus size={22} strokeWidth={1.75} className="mx-[3px] shrink-0 text-mist" aria-hidden />
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Nova tarefa"
                aria-label={`Nova tarefa, vale ${XP.task} XP ao concluir`}
                enterKeyHint="done"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-3 outline-none"
              />
            </div>
            {labels.length > 0 ? (
              <QuickChips labels={labels} onIgnore={ignore} className="pb-3 pl-[37px]" />
            ) : (
              focused &&
              !title && (
                <p className="pb-3 pl-[37px] text-sm text-mist">
                  Tente: pagar luz sexta !alta, ou regar toda segunda
                </p>
              )
            )}
          </form>
        </li>
      </ul>
    </section>
  )
}
