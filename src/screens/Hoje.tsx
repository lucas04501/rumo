import { Anchor, ChevronRight, Plus, Timer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useDay, type HabitToday } from '../data/DayProvider'
import { useFocusTimer } from '../data/focusTimer'
import { useSnapshot } from '../data/store'
import { addQuick, bringToToday } from '../data/taskActions'
import { useNow } from '../data/useNow'
import { formatLongDate, weekdayOf } from '../lib/dates'
import { periodDates, periodStats } from '../lib/evolution'
import { formatClock, isOver, leftMs } from '../lib/focus'
import { deadlineLabel } from '../lib/goals'
import { indexSnapshot } from '../lib/progress'
import { parseQuickAdd } from '../lib/quickAdd'
import { clockOf, currentStep, nextStep, stepsOn } from '../lib/routine'
import { isStreakMark } from '../lib/streaks'
import { overdueTasks } from '../lib/tasks'
import { XP } from '../lib/xp'
import { iconFor } from '../ui/habitIcons'
import { ItemRow } from '../ui/ItemRow'
import { Quote } from '../ui/Quote'
import { Screen } from '../ui/Screen'
import { SoundToggle } from '../ui/SoundToggle'
import { TaskRow } from '../ui/TaskRow'
import { Ticker } from '../ui/Ticker'
import { Route } from '../voyage/Route'

export function Hoje() {
  return (
    <Screen>
      <TopBar />
      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-16">
        <div>
          <Greeting />
          <Quote />
          <RoutineShortcut />
          <FocusGoal />
          <EvolutionShortcut />
        </div>
        <div className="lg:pt-8">
          <Habits />
          <Tasks />
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
    <header className="flex items-start justify-between">
      <p className="font-display text-[22px] font-semibold lg:invisible">Rumo</p>
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
            className="relative mt-1.5 ml-auto h-[3px] w-28 overflow-hidden rounded-full bg-white/12"
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
  const { date, name, habits, tasks, remaining } = useDay()
  const firstName = name.trim().split(/\s+/)[0]

  return (
    <div className="pt-7 lg:pt-8">
      <h1 className="font-display text-[42px]/[1.05] font-semibold tracking-[-0.025em] lg:text-[56px]">
        {greetingFor(new Date().getHours())}, {firstName}.
      </h1>
      <p className="mt-3 text-[17px]/snug text-mist">{formatLongDate(date)}</p>
      <p className="text-[17px]/snug">
        {tideSentence(remaining, habits.length + tasks.length === 0)}
      </p>
    </div>
  )
}

function FocusGoal() {
  const { goal, daysLeft, completeMilestone, arriveAtStation } = useDay()

  if (!goal || goal.milestones.length === 0) {
    return (
      <section aria-label="Metas" className="mt-7">
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
    <section aria-labelledby="meta-em-foco" className="mt-7">
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
    <section aria-labelledby="habitos-de-hoje" className="mt-8 lg:mt-0">
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
        <ul className="mt-2 divide-y divide-white/8">
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
    <Link to="/rotina" className="mt-5 flex min-h-11 items-center justify-between gap-3 text-[15px]">
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

function EvolutionShortcut() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const score = useMemo(
    () =>
      snapshot ? periodStats(snapshot, indexSnapshot(snapshot), periodDates(date, 7)).score : null,
    [snapshot, date],
  )

  if (score === null) return null

  return (
    <Link
      to="/evolucao"
      className="mt-5 flex min-h-11 items-center justify-between gap-3 text-[15px] text-mist"
    >
      <span>
        Últimos 7 dias: <span className="text-foam">{score}% do combinado</span>
      </span>
      <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
    </Link>
  )
}

function Overdue() {
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const overdue = snapshot ? overdueTasks(snapshot.tasks, date) : []

  if (overdue.length === 0) return null

  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-white/8 py-2">
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
  const { date, tasks } = useDay()
  const { data: snapshot } = useSnapshot()
  const [title, setTitle] = useState('')
  const [focused, setFocused] = useState(false)
  // "Ignorar" guarda o texto ignorado: ao digitar algo novo, a leitura volta.
  const [literal, setLiteral] = useState<string | null>(null)

  const intent = useMemo(() => parseQuickAdd(title, date), [title, date])
  const understood = literal !== title && intent.labels.length > 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = title.trim()
    if (!clean || !snapshot) return
    addQuick(
      understood ? intent : { ...intent, title: clean, date, priority: 'normal', repeat: null },
      date,
      snapshot,
    )
    setTitle('')
    setLiteral(null)
  }

  return (
    <section aria-labelledby="tarefas-de-hoje" className="mt-9">
      <div className="flex items-center justify-between gap-4">
        <h2 id="tarefas-de-hoje" className="font-display text-xl font-semibold">
          Tarefas
        </h2>
        <FocusShortcut />
      </div>
      <Overdue />
      <ul className="mt-1 divide-y divide-white/8">
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
            {understood ? (
              <div className="flex flex-wrap items-center gap-2 pb-3 pl-[37px]">
                {intent.labels.map((label) => (
                  <span key={label} className="quick-chip">
                    {label}
                  </span>
                ))}
                <button
                  type="button"
                  className="min-h-8 px-1 text-sm text-mist underline underline-offset-4"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setLiteral(title)}
                >
                  Ignorar
                </button>
              </div>
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
