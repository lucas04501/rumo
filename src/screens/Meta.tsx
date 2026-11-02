import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useDay } from '../data/DayProvider'
import { addGoalTask, setMainGoal, undoLastMilestone } from '../data/goalActions'
import { useSnapshot } from '../data/store'
import type { Habit, Note, Snapshot, Task } from '../data/types'
import { formatShortDate } from '../lib/dates'
import { consistency, deadlineLabel, goalProgress, paceSentence } from '../lib/goals'
import { visibleNotes } from '../lib/notes'
import { checksOf, planOf, withMilestones, type GoalInFocus } from '../lib/progress'
import { GoalSheet } from '../ui/GoalSheet'
import { iconFor } from '../ui/habitIcons'
import { LinkSheet } from '../ui/LinkSheet'
import { NoteRow } from '../ui/NoteRow'
import { NoteSheet } from '../ui/NoteSheet'
import { Screen } from '../ui/Screen'
import { TaskRow } from '../ui/TaskRow'
import { Route } from '../voyage/Route'

const ROW_HEIGHT = 76

export function Meta() {
  const { id } = useParams()
  const { date } = useDay()
  const { data: snapshot } = useSnapshot()
  const [editing, setEditing] = useState(false)
  const [linking, setLinking] = useState(false)

  const found = snapshot?.goals.find((goal) => goal.id === id)

  if (!snapshot || !found) {
    return (
      <Screen>
        <BackLink />
        <h1 className="mt-4 font-display text-3xl font-semibold">Meta não encontrada</h1>
        <p className="mt-2 text-[17px] text-mist">Ela pode ter sido excluída.</p>
      </Screen>
    )
  }

  const goal = withMilestones(found, snapshot)
  const progress = goalProgress(goal.milestones, goal.targetDate, date)
  const finished = goal.status === 'done'
  const pace = paceSentence(progress)
  const active = snapshot.goals.filter((item) => item.status === 'active')
  const isMain = active[0]?.id === goal.id

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <BackLink />
        <button
          type="button"
          className="icon-button -mr-2.5"
          aria-label="Editar meta"
          onClick={() => setEditing(true)}
        >
          <Pencil size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-16">
        <div>
          <h1 className="mt-2 font-display text-4xl/[1.08] font-semibold tracking-[-0.02em]">
            {goal.title}
          </h1>
          {goal.why && <p className="mt-2 max-w-[52ch] text-[17px] text-mist">{goal.why}</p>}

          <p className="mt-4 text-[17px]">
            {progress.reached} de {progress.total} {progress.total === 1 ? 'marco' : 'marcos'}
            <span className="text-mist">
              {' '}
              · {deadlineLabel(progress.daysLeft, finished)}
              {goal.targetDate && !finished && ` · ${formatShortDate(goal.targetDate)}`}
            </span>
          </p>
          {pace && <p className="mt-1 text-[15px] text-mist">{pace}</p>}

          {!finished && !isMain && (
            <button
              type="button"
              className="mt-3 min-h-11 text-[15px] text-mist underline underline-offset-4"
              onClick={() => setMainGoal(goal.id, active)}
            >
              Tornar meta principal
            </button>
          )}

          <Voyage goal={goal} finished={finished} />
        </div>

        <div className="lg:pt-2">
          <LinkedHabits
            goal={goal}
            snapshot={snapshot}
            today={date}
            onLink={() => setLinking(true)}
          />
          <GoalTasks goal={goal} snapshot={snapshot} today={date} />
          <GoalNotes goal={goal} snapshot={snapshot} />
        </div>
      </div>

      {editing && (
        <GoalSheet
          goal={found}
          milestones={goal.milestones}
          position={found.position}
          today={date}
          onClosed={() => setEditing(false)}
        />
      )}
      {linking && (
        <LinkSheet goal={found} snapshot={snapshot} today={date} onClosed={() => setLinking(false)} />
      )}
    </Screen>
  )
}

function BackLink() {
  return (
    <Link to="/metas" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 text-[15px] text-mist">
      <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
      Metas
    </Link>
  )
}

function Voyage({ goal, finished }: { goal: GoalInFocus; finished: boolean }) {
  const { completeMilestone, arriveAtStation } = useDay()
  const rows = goal.milestones.length

  return (
    <section aria-label="Rota até o destino" className="mt-6">
      <div className="relative" style={{ height: ROW_HEIGHT * (rows + 1) }}>
        <Route
          milestones={rows}
          reached={goal.reached}
          rowHeight={ROW_HEIGHT}
          label={`Rota com ${rows} marcos, ${goal.reached} concluídos`}
          onArrive={(station) => arriveAtStation(goal, station)}
        />
        <ol className="absolute inset-0 pl-16">
          <li className="flex items-center text-[15px] text-mist" style={{ height: ROW_HEIGHT }}>
            Partida
          </li>
          {goal.milestones.map((milestone, index) => {
            const isNext = index === goal.reached && !finished
            const isLastDone = index === goal.reached - 1

            return (
              <li
                key={milestone.id}
                className="flex items-center justify-between gap-3"
                style={{ height: ROW_HEIGHT }}
                aria-current={isNext ? 'step' : undefined}
              >
                <span
                  className={`line-clamp-2 min-w-0 text-[17px] ${
                    index < goal.reached ? 'text-foam/70' : index === goal.reached ? '' : 'text-mist'
                  }`}
                >
                  {milestone.title}
                </span>
                {isNext && (
                  <button type="button" className="action" onClick={() => completeMilestone(goal)}>
                    Concluir
                  </button>
                )}
                {isLastDone && (
                  <button
                    type="button"
                    className="min-h-11 shrink-0 px-1 text-[15px] text-mist underline underline-offset-4"
                    onClick={() => undoLastMilestone(goal)}
                  >
                    Desfazer
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

type LinkedHabitsProps = {
  goal: GoalInFocus
  snapshot: Snapshot
  today: string
  onLink: () => void
}

function LinkedHabits({ goal, snapshot, today, onLink }: LinkedHabitsProps) {
  const habits = snapshot.habits.filter((habit) => habit.goalId === goal.id)

  return (
    <section aria-labelledby="habitos-ligados" className="mt-8 lg:mt-0">
      <div className="flex items-center justify-between gap-4">
        <h2 id="habitos-ligados" className="font-display text-xl font-semibold">
          Hábitos ligados
        </h2>
        <button type="button" className="ghost" onClick={onLink}>
          Vincular
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="mt-2 text-[15px] text-mist">
          Ligue os hábitos que levam a este destino e acompanhe a consistência aqui.
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-white/8">
          {habits.map((habit) => (
            <li key={habit.id}>
              <LinkedHabit habit={habit} snapshot={snapshot} today={today} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function LinkedHabit({ habit, snapshot, today }: { habit: Habit; snapshot: Snapshot; today: string }) {
  const Icon = iconFor(habit.icon)
  const { percent } = consistency(planOf(habit, snapshot), checksOf(habit.id, snapshot), today)

  return (
    <div className="flex min-h-13 items-center gap-3">
      <Icon size={19} strokeWidth={1.75} className="shrink-0 text-mist" aria-hidden />
      <span className="min-w-0 flex-1 text-[17px]">{habit.title}</span>
      <span className="shrink-0 text-[15px] text-mist">
        {percent === null ? 'Começando' : `${percent}% em 30 dias`}
      </span>
    </div>
  )
}

function GoalTasks({ goal, snapshot, today }: { goal: GoalInFocus; snapshot: Snapshot; today: string }) {
  const [title, setTitle] = useState('')

  const tasks: Task[] = snapshot.tasks
    .filter((task) => task.goalId === goal.id)
    .sort((a, b) => Number(Boolean(a.doneAt)) - Number(Boolean(b.doneAt)))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = title.trim()
    if (!clean) return
    addGoalTask(clean, today, goal.id, snapshot.tasks.length)
    setTitle('')
  }

  return (
    <section aria-labelledby="tarefas-da-meta" className="mt-8">
      <h2 id="tarefas-da-meta" className="font-display text-xl font-semibold">
        Tarefas da meta
      </h2>
      <ul className="mt-1 divide-y divide-white/8">
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
              placeholder="Nova tarefa para hoje"
              aria-label="Nova tarefa para hoje, ligada a esta meta"
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

function GoalNotes({ goal, snapshot }: { goal: GoalInFocus; snapshot: Snapshot }) {
  const [opened, setOpened] = useState<{ note: Note | null } | null>(null)
  const notes = visibleNotes(
    snapshot.notes.filter((note) => note.goalId === goal.id),
    '',
  )

  return (
    <section aria-labelledby="notas-da-meta" className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 id="notas-da-meta" className="font-display text-xl font-semibold">
          Notas da meta
        </h2>
        <button type="button" className="ghost" onClick={() => setOpened({ note: null })}>
          Nova nota
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="mt-2 text-[15px] text-mist">
          Guarde aqui o que você aprende e decide no caminho até este destino.
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-white/8">
          {notes.map((note) => (
            <li key={note.id}>
              <NoteRow note={note} onOpen={() => setOpened({ note })} />
            </li>
          ))}
        </ul>
      )}

      {opened && (
        <NoteSheet
          note={opened.note}
          goalId={goal.id}
          goals={snapshot.goals}
          onClosed={() => setOpened(null)}
        />
      )}
    </section>
  )
}
