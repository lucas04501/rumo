import { Anchor, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { USER_NAME } from '../data/demo'
import { useDay, type HabitToday } from '../data/DayProvider'
import { formatLongDate } from '../lib/dates'
import { XP } from '../lib/xp'
import { HABIT_ICONS } from '../ui/habitIcons'
import { ItemRow } from '../ui/ItemRow'
import { Quote } from '../ui/Quote'
import { Screen } from '../ui/Screen'
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
          <FocusGoal />
        </div>
        <div className="lg:pt-8">
          <Habits />
          <Tasks />
          <p className="mt-10 text-sm text-mist">
            Dados de demonstração. Recarregue a página para recomeçar.
          </p>
        </div>
      </div>
    </Screen>
  )
}

function TopBar() {
  const { xp, rank } = useDay()

  return (
    <header className="flex items-start justify-between">
      <p className="font-display text-[22px] font-semibold lg:invisible">Rumo</p>
      <div className="text-right">
        <p className="text-sm leading-tight">
          <span className="text-mist">{rank.name} · </span>
          <span className="font-semibold">
            <Ticker value={xp} /> XP
          </span>
        </p>
        <div
          role="progressbar"
          aria-label="Avanço até a próxima patente"
          aria-valuenow={Math.round(rank.progress * 100)}
          className="mt-1.5 ml-auto h-[3px] w-28 overflow-hidden rounded-full bg-white/12"
        >
          <div
            className="h-full origin-left rounded-full bg-sun transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${rank.progress})` }}
          />
        </div>
      </div>
    </header>
  )
}

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function tideSentence(remaining: number): string {
  if (remaining === 0) return 'Maré cheia.'
  if (remaining === 1) return 'Falta 1 para a maré cheia.'
  return `Faltam ${remaining} para a maré cheia.`
}

function Greeting() {
  const { date, remaining } = useDay()

  return (
    <div className="pt-7 lg:pt-8">
      <h1 className="font-display text-[42px]/[1.05] font-semibold tracking-[-0.025em] lg:text-[56px]">
        {greetingFor(new Date().getHours())}, {USER_NAME}.
      </h1>
      <p className="mt-3 text-[17px]/snug text-mist">{formatLongDate(date)}</p>
      <p className="text-[17px]/snug">{tideSentence(remaining)}</p>
    </div>
  )
}

function deadlineLabel(daysLeft: number, finished: boolean): string {
  if (finished) return 'Concluída'
  if (daysLeft > 1) return `Faltam ${daysLeft} dias`
  if (daysLeft === 1) return 'Falta 1 dia'
  return daysLeft === 0 ? 'Termina hoje' : 'Prazo encerrado'
}

function FocusGoal() {
  const { goal, daysLeft, completeMilestone, arriveAtStation } = useDay()
  const milestones = goal.milestones.length
  const next = goal.milestones[goal.reached]

  return (
    <section aria-labelledby="meta-em-foco" className="mt-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="meta-em-foco" className="font-display text-xl font-semibold">
          {goal.title}
        </h2>
        <p className="shrink-0 text-[15px] text-mist">{deadlineLabel(daysLeft, !next)}</p>
      </div>

      <div className="mt-4">
        <Route
          milestones={milestones}
          reached={goal.reached}
          label={`Rota da meta: ${goal.reached} de ${milestones} marcos concluídos`}
          onArrive={arriveAtStation}
        />
      </div>

      <div className="mt-3 flex min-h-11 items-center justify-between gap-4">
        {next ? (
          <>
            <p className="min-w-0 text-[15px] text-mist">
              Próximo marco: <span className="text-foam">{next}</span>
            </p>
            <button type="button" className="action" onClick={completeMilestone}>
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
  const { habits } = useDay()
  const done = habits.filter((habit) => habit.done).length

  return (
    <section aria-labelledby="habitos-de-hoje" className="mt-8 lg:mt-0">
      <div className="flex items-baseline justify-between">
        <h2 id="habitos-de-hoje" className="font-display text-xl font-semibold">
          Hábitos de hoje
        </h2>
        <p className="text-[15px] text-mist">
          {done} de {habits.length}
        </p>
      </div>
      <ul className="mt-2 divide-y divide-white/8">
        {habits.map((habit) => (
          <li key={habit.id}>
            <HabitRow habit={habit} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function HabitRow({ habit }: { habit: HabitToday }) {
  const { toggleHabit } = useDay()
  const Icon = HABIT_ICONS[habit.icon]

  return (
    <ItemRow
      title={habit.title}
      done={habit.done}
      onToggle={() => toggleHabit(habit.id)}
      leading={<Icon size={19} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />}
      trailing={
        <span className="flex shrink-0 items-center gap-1 text-[15px] text-mist">
          {habit.anchorUsed && (
            <Anchor size={14} strokeWidth={1.75} aria-label="Âncora em uso: uma falta perdoada" />
          )}
          {habit.streak} {habit.streak === 1 ? 'dia' : 'dias'}
        </span>
      }
    />
  )
}

function Tasks() {
  const { tasks, toggleTask, addTask } = useDay()
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
            <ItemRow title={task.title} done={task.done} onToggle={() => toggleTask(task.id)} />
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
