import { Anchor, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { authClient } from '../data/authClient'
import { useDay, type HabitToday } from '../data/DayProvider'
import { clearDevice } from '../data/store'
import { formatLongDate } from '../lib/dates'
import { deadlineLabel } from '../lib/goals'
import { isStreakMark } from '../lib/streaks'
import { XP } from '../lib/xp'
import { iconFor } from '../ui/habitIcons'
import { ItemRow } from '../ui/ItemRow'
import { Quote } from '../ui/Quote'
import { Screen } from '../ui/Screen'
import { SoundToggle } from '../ui/SoundToggle'
import { TaskRow } from '../ui/TaskRow'
import { Ticker } from '../ui/Ticker'
import { Route } from '../voyage/Route'

async function signOut() {
  await authClient.signOut()
  await clearDevice()
}

export function Hoje() {
  return (
    <Screen>
      <TopBar />
      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-16">
        <div>
          <Greeting />
          <Quote />
          <FocusGoal />
        </div>
        <div className="lg:pt-8">
          <Habits />
          <Tasks />
          <button
            type="button"
            className="mt-8 -ml-1 min-h-11 px-1 text-sm text-mist underline underline-offset-4"
            onClick={signOut}
          >
            Sair da conta
          </button>
          <p className="text-sm text-mist">Versão {__APP_VERSION__}</p>
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

function Tasks() {
  const { tasks, addTask } = useDay()
  const [title, setTitle] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = title.trim()
    if (!clean) return
    addTask(clean)
    setTitle('')
  }

  return (
    <section aria-labelledby="tarefas-de-hoje" className="mt-9">
      <h2 id="tarefas-de-hoje" className="font-display text-xl font-semibold">
        Tarefas
      </h2>
      <ul className="mt-2 divide-y divide-white/8">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskRow task={task} />
          </li>
        ))}
        <li>
          <form onSubmit={submit} className="flex min-h-14 items-center gap-3">
            <Plus size={22} strokeWidth={1.75} className="mx-[3px] shrink-0 text-mist" aria-hidden />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nova tarefa"
              aria-label={`Nova tarefa, vale ${XP.task} XP ao concluir`}
              enterKeyHint="done"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-3 outline-none"
            />
          </form>
        </li>
      </ul>
    </section>
  )
}
